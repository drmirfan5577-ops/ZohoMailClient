import { useState, useCallback } from "react";
import { fetchAccounts, fetchEmails, getCachedAccount, setCachedAccount } from "@/lib/zoho";
import type { ZohoEmail, ZohoAccount } from "@/types/email";
import { FOLDER_NAMES, type FolderName } from "@/constants/zoho";
import { toast } from "sonner";

export function useEmails() {
  const [emails, setEmails] = useState<ZohoEmail[]>([]);
  const [account, setAccount] = useState<ZohoAccount | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderName>(FOLDER_NAMES.INBOX);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveAccount = useCallback(async (): Promise<ZohoAccount | null> => {
    const cached = getCachedAccount();
    if (cached.accountId) {
      const acc: ZohoAccount = {
        accountId: cached.accountId,
        emailAddress: cached.accountEmail,
        displayName: cached.accountEmail,
        isPrimary: true,
      };
      setAccount(acc);
      return acc;
    }
    const accounts = await fetchAccounts();
    const primary = accounts.find((a) => a.isPrimary) || accounts[0];
    if (primary) {
      setAccount(primary);
      setCachedAccount(primary.accountId, primary.emailAddress);
    }
    return primary || null;
  }, []);

  const loadFolder = useCallback(
    async (folderName: FolderName, accountId?: string) => {
      setIsLoading(true);
      setError(null);
      setActiveFolder(folderName);
      try {
        let aid = accountId;
        if (!aid) {
          const acc = await resolveAccount();
          if (!acc) throw new Error("No Zoho Mail account found.");
          aid = acc.accountId;
        }
        const data = await fetchEmails(aid, folderName);
        setEmails(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load emails";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [resolveAccount]
  );

  const refresh = useCallback(async () => {
    const acc = account;
    await loadFolder(activeFolder, acc?.accountId);
  }, [account, activeFolder, loadFolder]);

  const switchFolder = useCallback(
    (folderName: FolderName) => {
      loadFolder(folderName, account?.accountId);
    },
    [account, loadFolder]
  );

  return {
    emails,
    account,
    activeFolder,
    isLoading,
    error,
    refresh,
    switchFolder,
    loadFolder,
    resolveAccount,
  };
}
