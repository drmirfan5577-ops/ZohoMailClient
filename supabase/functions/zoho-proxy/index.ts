// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ZOHO_AUTH_BASE = "https://accounts.zoho.eu/oauth/v2";
const ZOHO_API_BASE = "https://mail.zoho.eu/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { action, session_token } = body;
  console.log(`zoho-proxy action: ${action}`);

  try {
    // ── exchange-and-store ──────────────────────────────────────────────────
    if (action === "exchange-and-store") {
      const { code, client_id, client_secret, redirect_uri } = body as {
        code: string; client_id: string; client_secret: string; redirect_uri: string;
      };

      const tokenParams: Record<string, string> = {
        grant_type: "authorization_code",
        client_id,
        client_secret,
        code,
      };
      // redirect_uri is optional for Self-Client grant tokens
      if (redirect_uri) tokenParams.redirect_uri = redirect_uri;

      const params = new URLSearchParams(tokenParams);

      const tokenRes = await fetch(`${ZOHO_AUTH_BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const tokenData = await tokenRes.json();
      console.log("Token exchange response:", JSON.stringify(tokenData));
      if (tokenData.error) throw new Error(`Zoho: ${tokenData.error}`);

      // Fetch account info
      let accountId = "";
      let accountEmail = "";
      try {
        const accRes = await fetch(`${ZOHO_API_BASE}/accounts`, {
          headers: { Authorization: `Zoho-oauthtoken ${tokenData.access_token}` },
        });
        const accData = await accRes.json();
        const primary = (accData.data || []).find((a: any) => a.isPrimary) || accData.data?.[0];
        if (primary) {
          accountId = primary.accountId;
          accountEmail = primary.emailAddress;
        }
      } catch (e) {
        console.error("Could not fetch account info:", e);
      }

      const newSessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + (tokenData.expires_in - 60) * 1000).toISOString();

      const { error: dbErr } = await supabaseAdmin.from("zoho_sessions").insert({
        session_token: newSessionToken,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        client_id,
        client_secret,
        account_id: accountId,
        account_email: accountEmail,
      });

      if (dbErr) throw new Error(`DB: ${dbErr.message}`);

      return json({ session_token: newSessionToken, account_id: accountId, account_email: accountEmail });
    }

    // ── get-session-info ───────────────────────────────────────────────────
    if (action === "get-session-info") {
      const session = await getSession(supabaseAdmin, session_token as string);
      return json({ account_id: session.account_id, account_email: session.account_email });
    }

    // ── delete-session ─────────────────────────────────────────────────────
    if (action === "delete-session") {
      await supabaseAdmin.from("zoho_sessions").delete().eq("session_token", session_token);
      return json({ ok: true });
    }

    // ── api-request ────────────────────────────────────────────────────────
    if (action === "api-request") {
      const { path, method = "GET", body: reqBody } = body as {
        path: string; method?: string; body?: unknown;
      };
      const session = await getSession(supabaseAdmin, session_token as string);
      const token = await ensureFreshToken(supabaseAdmin, session);

      const response = await fetch(`${ZOHO_API_BASE}${path}`, {
        method,
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
        body: reqBody ? JSON.stringify(reqBody) : undefined,
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(`Zoho API ${response.status}: ${JSON.stringify(responseData)}`);
      return json(responseData);
    }

    // ── send-email ─────────────────────────────────────────────────────────
    if (action === "send-email") {
      const { account_id, to, subject, content, attachments = [] } = body as {
        account_id: string; to: string; subject: string; content: string;
        attachments?: Array<{ name: string; type: string; data: string; size: number }>;
      };

      const session = await getSession(supabaseAdmin, session_token as string);
      const token = await ensureFreshToken(supabaseAdmin, session);
      const aid = account_id || session.account_id;

      if (!attachments || attachments.length === 0) {
        // Simple JSON send
        const res = await fetch(`${ZOHO_API_BASE}/accounts/${aid}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ toAddress: to, subject, content, mailFormat: "html" }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Zoho send: ${err}`);
        }
        return json({ ok: true });
      }

      // Multipart send with attachments
      const formData = new FormData();
      formData.append("toAddress", to);
      formData.append("subject", subject);
      formData.append("content", content);
      formData.append("mailFormat", "html");

      for (const att of attachments) {
        try {
          const bytes = Uint8Array.from(atob(att.data), (c) => c.charCodeAt(0));
          const blob = new Blob([bytes], { type: att.type });
          formData.append("attachments", blob, att.name);
        } catch (e) {
          console.error("Attachment parse error:", e);
        }
      }

      const res = await fetch(`${ZOHO_API_BASE}/accounts/${aid}/messages`, {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Zoho send (multipart): ${err}`);
      }
      return json({ ok: true });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("zoho-proxy error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getSession(supabase: any, sessionToken: string) {
  if (!sessionToken) throw new Error("No session token provided");
  const { data, error } = await supabase
    .from("zoho_sessions")
    .select("*")
    .eq("session_token", sessionToken)
    .single();
  if (error || !data) throw new Error("Session not found. Please re-authenticate.");
  return data;
}

async function ensureFreshToken(supabase: any, session: any): Promise<string> {
  if (new Date(session.expires_at) > new Date(Date.now() + 30_000)) {
    return session.access_token;
  }

  // Refresh
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: session.client_id,
    client_secret: session.client_secret,
    refresh_token: session.refresh_token,
  });

  const res = await fetch(`${ZOHO_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Token refresh: ${data.error}`);

  const newExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000).toISOString();
  await supabase
    .from("zoho_sessions")
    .update({ access_token: data.access_token, expires_at: newExpiry })
    .eq("session_token", session.session_token);

  return data.access_token;
}
