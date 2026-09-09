import { useState, useCallback } from "react";
import { fetchFolders } from "@/lib/zoho";
import type { ZohoFolder } from "@/types/email";
import { FOLDER_NAMES, type FolderName } from "@/constants/zoho";

const FOLDER_ORDER: string[] = [
  FOLDER_NAMES.INBOX,
  FOLDER_NAMES.SENT,
  FOLDER_NAMES.DRAFTS,
  FOLDER_NAMES.TRASH,
  FOLDER_NAMES.SPAM,
];

export function useFolders(accountId: string) {
  const [folders, setFolders] = useState<ZohoFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFolders = useCallback(async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const data = await fetchFolders(accountId);
      // Sort by preferred order
      const sorted = [...data].sort((a, b) => {
        const ai = FOLDER_ORDER.indexOf(a.folderName);
        const bi = FOLDER_ORDER.indexOf(b.folderName);
        if (ai === -1 && bi === -1) return a.folderName.localeCompare(b.folderName);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      setFolders(sorted);
    } catch (err) {
      console.error("Could not load folders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  const getUnreadCount = (folderName: FolderName): number => {
    const folder = folders.find((f) => f.folderName === folderName);
    return folder?.unreadCount || 0;
  };

  return { folders, isLoading, loadFolders, getUnreadCount };
}
