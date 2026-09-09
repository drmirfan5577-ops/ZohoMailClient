import { useState, useEffect } from "react";
import { getSessionToken, deleteSession, getCachedAccount } from "@/lib/zoho";

export function useZohoAuth() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    setSessionToken(token);
    if (token) {
      const { accountId: aid, accountEmail: email } = getCachedAccount();
      setAccountId(aid);
      setAccountEmail(email);
    }
    setIsLoading(false);
  }, []);

  const logout = async () => {
    await deleteSession();
    setSessionToken(null);
    setAccountId("");
    setAccountEmail("");
  };

  const refresh = () => {
    const token = getSessionToken();
    setSessionToken(token);
    if (token) {
      const { accountId: aid, accountEmail: email } = getCachedAccount();
      setAccountId(aid);
      setAccountEmail(email);
    }
  };

  const isAuthenticated = !!sessionToken;

  return { sessionToken, isAuthenticated, isLoading, accountId, accountEmail, logout, refresh };
}
