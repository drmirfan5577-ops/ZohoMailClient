import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { ZOHO_CONFIG, STORAGE_KEYS } from "@/constants/zoho";
import type { ZohoAccount, ZohoEmail, ZohoEmailContent, ZohoFolder, AttachmentFile } from "@/types/email";

// ─── Session Storage ──────────────────────────────────────────────────────────

export function getSessionToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
}

export function setSessionToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CACHED_ACCOUNT_ID);
  localStorage.removeItem(STORAGE_KEYS.CACHED_ACCOUNT_EMAIL);
}

export function getCachedAccount() {
  return {
    accountId: localStorage.getItem(STORAGE_KEYS.CACHED_ACCOUNT_ID) || "",
    accountEmail: localStorage.getItem(STORAGE_KEYS.CACHED_ACCOUNT_EMAIL) || "",
  };
}

export function setCachedAccount(accountId: string, accountEmail: string) {
  localStorage.setItem(STORAGE_KEYS.CACHED_ACCOUNT_ID, accountId);
  localStorage.setItem(STORAGE_KEYS.CACHED_ACCOUNT_EMAIL, accountEmail);
}

export function getSavedClientId(): string {
  return localStorage.getItem(STORAGE_KEYS.SAVED_CLIENT_ID) || "";
}

export function saveClientId(clientId: string) {
  localStorage.setItem(STORAGE_KEYS.SAVED_CLIENT_ID, clientId);
}

// ─── Edge Function Proxy ──────────────────────────────────────────────────────

async function callProxy<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("zoho-proxy", { body });
  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const statusCode = error.context?.status ?? 500;
        const textContent = await error.context?.text();
        errorMessage = `[${statusCode}] ${textContent || error.message}`;
      } catch {
        errorMessage = error.message || "Request failed";
      }
    }
    throw new Error(errorMessage);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// ─── Direct Connect (Self-Client Grant Token) ─────────────────────────────────

/**
 * Exchange a Zoho Self-Client grant token directly for persistent tokens.
 * No redirect URI setup required.
 */
export async function connectWithGrantToken(
  clientId: string,
  clientSecret: string,
  grantToken: string
): Promise<{ sessionToken: string; accountId: string; accountEmail: string }> {
  const result = await callProxy<{ session_token: string; account_id: string; account_email: string }>({
    action: "exchange-and-store",
    code: grantToken,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: "",   // not required for Self-Client grant tokens
  });
  setSessionToken(result.session_token);
  setCachedAccount(result.account_id, result.account_email);
  saveClientId(clientId);
  return {
    sessionToken: result.session_token,
    accountId: result.account_id,
    accountEmail: result.account_email,
  };
}

export async function deleteSession(): Promise<void> {
  const sessionToken = getSessionToken();
  if (!sessionToken) return;
  await callProxy({ action: "delete-session", session_token: sessionToken }).catch(console.error);
  clearSession();
}

// ─── Zoho API Calls (via proxy) ───────────────────────────────────────────────

async function apiRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const sessionToken = getSessionToken();
  if (!sessionToken) throw new Error("Not authenticated");
  return callProxy<T>({ action: "api-request", session_token: sessionToken, path, method, body });
}

export async function fetchAccounts(): Promise<ZohoAccount[]> {
  const data = await apiRequest<{ data: ZohoAccount[] }>("/accounts");
  return data.data || [];
}

export async function fetchFolders(accountId: string): Promise<ZohoFolder[]> {
  const data = await apiRequest<{ data: ZohoFolder[] }>(`/accounts/${accountId}/folders`);
  return data.data || [];
}

export async function fetchEmails(
  accountId: string,
  folderName: string,
  limit = 25,
  start = 0
): Promise<ZohoEmail[]> {
  const data = await apiRequest<{ data: ZohoEmail[] }>(
    `/accounts/${accountId}/messages/view?foldername=${folderName}&limit=${limit}&start=${start}`
  );
  return data.data || [];
}

// Legacy alias
export const fetchInbox = (accountId: string, limit?: number, start?: number) =>
  fetchEmails(accountId, "Inbox", limit, start);

export async function fetchEmailContent(
  accountId: string,
  messageId: string
): Promise<ZohoEmailContent> {
  const data = await apiRequest<{ data: ZohoEmailContent }>(
    `/accounts/${accountId}/messages/${messageId}/content`
  );
  return data.data;
}

export async function sendEmail(
  accountId: string,
  to: string,
  subject: string,
  content: string,
  attachments?: AttachmentFile[]
): Promise<void> {
  const sessionToken = getSessionToken();
  if (!sessionToken) throw new Error("Not authenticated");
  await callProxy({
    action: "send-email",
    session_token: sessionToken,
    account_id: accountId,
    to,
    subject,
    content,
    attachments: attachments || [],
  });
}

// ─── Legacy compat exports ────────────────────────────────────────────────────
export function getStoredTokens() {
  return getSessionToken() ? { access_token: "backend" } : null;
}
export function getCredentials() {
  return { clientId: getSavedClientId(), clientSecret: "" };
}
export function saveCredentials(clientId: string) {
  saveClientId(clientId);
}
