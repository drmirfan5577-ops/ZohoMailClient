import { useEffect } from "react";
import { Inbox, Send, FileText, Trash2, ShieldAlert, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOLDER_NAMES, type FolderName } from "@/constants/zoho";
import type { ZohoFolder } from "@/types/email";
import { useNavigate } from "react-router-dom";

interface FolderSidebarProps {
  activeFolder: FolderName;
  onSelectFolder: (folder: FolderName) => void;
  folders: ZohoFolder[];
  accountEmail?: string;
}

const FOLDER_META: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  [FOLDER_NAMES.INBOX]: {
    icon: Inbox,
    color: "text-violet-600",
    gradient: "from-violet-500 to-indigo-500",
  },
  [FOLDER_NAMES.SENT]: {
    icon: Send,
    color: "text-sky-600",
    gradient: "from-sky-400 to-blue-500",
  },
  [FOLDER_NAMES.DRAFTS]: {
    icon: FileText,
    color: "text-amber-600",
    gradient: "from-amber-400 to-orange-500",
  },
  [FOLDER_NAMES.TRASH]: {
    icon: Trash2,
    color: "text-rose-500",
    gradient: "from-rose-400 to-red-500",
  },
  [FOLDER_NAMES.SPAM]: {
    icon: ShieldAlert,
    color: "text-slate-500",
    gradient: "from-slate-400 to-slate-500",
  },
};

const DEFAULT_FOLDERS: FolderName[] = [
  FOLDER_NAMES.INBOX,
  FOLDER_NAMES.SENT,
  FOLDER_NAMES.DRAFTS,
  FOLDER_NAMES.TRASH,
];

export default function FolderSidebar({
  activeFolder,
  onSelectFolder,
  folders,
  accountEmail,
}: FolderSidebarProps) {
  const navigate = useNavigate();

  // Determine which folders to show: use live data if available, else defaults
  const displayFolders: FolderName[] =
    folders.length > 0
      ? (folders.map((f) => f.folderName) as FolderName[])
      : DEFAULT_FOLDERS;

  const getUnread = (name: string) =>
    folders.find((f) => f.folderName === name)?.unreadCount || 0;

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col">
      {/* Account pill */}
      {accountEmail && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-sm">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Account</p>
          <p className="text-xs text-slate-700 font-semibold truncate">{accountEmail}</p>
        </div>
      )}

      {/* Compose button */}
      <button
        onClick={() => navigate("/compose")}
        className="flex items-center justify-center gap-2 w-full h-11 mb-4 rounded-xl
          bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold
          shadow-md shadow-violet-200 hover:from-violet-700 hover:to-indigo-700
          hover:shadow-violet-300 transition-all duration-200"
      >
        <PenSquare size={15} />
        Compose
      </button>

      {/* Folder list */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/90 rounded-2xl shadow-sm shadow-violet-50 p-2 flex flex-col gap-0.5">
        {displayFolders.map((folderName) => {
          const meta = FOLDER_META[folderName] || FOLDER_META[FOLDER_NAMES.INBOX];
          const Icon = meta.icon;
          const unread = getUnread(folderName);
          const isActive = activeFolder === folderName;

          return (
            <button
              key={folderName}
              onClick={() => onSelectFolder(folderName)}
              className={cn(
                "group relative flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-violet-100/90 to-indigo-100/70 text-violet-800 shadow-sm"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-800"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                    isActive
                      ? `bg-gradient-to-br ${meta.gradient} shadow-sm`
                      : "bg-slate-100 group-hover:bg-slate-200"
                  )}
                >
                  <Icon
                    size={14}
                    className={isActive ? "text-white" : meta.color}
                  />
                </div>
                <span>{folderName}</span>
              </div>

              {unread > 0 && (
                <span
                  className={cn(
                    "min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center",
                    isActive
                      ? "bg-violet-600 text-white"
                      : "bg-violet-100 text-violet-700"
                  )}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 inset-y-1 w-0.5 rounded-r-full bg-gradient-to-b from-violet-500 to-indigo-500" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
