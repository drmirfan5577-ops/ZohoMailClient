import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Mail, MailOpen, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import EmailCard from "@/components/features/EmailCard";
import FolderSidebar from "@/components/features/FolderSidebar";
import { useEmails } from "@/hooks/useEmails";
import { useZohoAuth } from "@/hooks/useZohoAuth";
import { useFolders } from "@/hooks/useFolders";
import { FOLDER_NAMES, type FolderName } from "@/constants/zoho";
import type { ZohoEmail } from "@/types/email";
import { cn } from "@/lib/utils";

export default function Inbox() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, accountId, accountEmail } = useZohoAuth();
  const { emails, account, activeFolder, isLoading, error, refresh, switchFolder, loadFolder } = useEmails();
  const { folders, loadFolders } = useFolders(accountId || account?.accountId || "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/auth");
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFolder(FOLDER_NAMES.INBOX).then(() => {
        const aid = accountId || account?.accountId;
        if (aid) loadFolders();
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const aid = accountId || account?.accountId;
    if (aid) loadFolders();
  }, [accountId, account?.accountId]);

  const handleFolderSwitch = (folder: FolderName) => {
    setSidebarOpen(false);
    switchFolder(folder);
  };

  const filtered = emails.filter((e: ZohoEmail) => {
    const matchSearch =
      !search ||
      e.subject?.toLowerCase().includes(search.toLowerCase()) ||
      e.fromAddress?.toLowerCase().includes(search.toLowerCase()) ||
      e.summary?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "unread" && (!e.isRead || e.status === "unread")) ||
      (filter === "read" && e.isRead && e.status !== "unread");
    return matchSearch && matchFilter;
  });

  const unreadCount = emails.filter((e) => !e.isRead || e.status === "unread").length;
  const displayAccountEmail = accountEmail || account?.emailAddress || "";

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-violet-50/60 to-indigo-50/80 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(167,139,250,0.15)_0%,_transparent_50%)] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(99,102,241,0.12)_0%,_transparent_50%)] -z-10" />

      <Header onRefresh={refresh} isRefreshing={isLoading} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Mobile: folder toggle */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 border border-white/80 text-slate-600 text-sm font-medium shadow-sm hover:bg-white/90 transition-all"
          >
            {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
            {activeFolder}
            {unreadCount > 0 && (
              <span className="bg-violet-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden mb-4">
            <FolderSidebar
              activeFolder={activeFolder}
              onSelectFolder={handleFolderSwitch}
              folders={folders}
              accountEmail={displayAccountEmail}
            />
          </div>
        )}

        {/* Desktop two-column layout */}
        <div className="flex gap-5">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FolderSidebar
              activeFolder={activeFolder}
              onSelectFolder={handleFolderSwitch}
              folders={folders}
              accountEmail={displayAccountEmail}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Folder heading */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{activeFolder}</h1>
                {unreadCount > 0 && activeFolder === FOLDER_NAMES.INBOX && (
                  <p className="text-sm text-slate-500">{unreadCount} unread message{unreadCount !== 1 ? "s" : ""}</p>
                )}
              </div>
            </div>

            {/* Search + filter */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/90 rounded-2xl shadow-sm p-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={`Search ${activeFolder.toLowerCase()}…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-white/80 border-slate-200 rounded-xl focus:border-violet-400 placeholder:text-slate-300 text-sm"
                  />
                </div>
                <div className="flex gap-0.5 bg-slate-100/80 rounded-xl p-1">
                  {(["all", "unread", "read"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                        filter === f ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Email list */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/90 rounded-2xl shadow-sm p-3">
              {isLoading && (
                <div className="space-y-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-[72px] rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 animate-pulse" />
                  ))}
                </div>
              )}

              {!isLoading && error && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-3">
                    <Mail size={22} className="text-rose-400" />
                  </div>
                  <p className="text-slate-700 font-medium">Failed to load</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">{error}</p>
                  <button
                    onClick={refresh}
                    className="mt-4 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-700 hover:to-indigo-700 transition-all"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !error && filtered.length === 0 && (
                <div className="text-center py-14">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-3">
                    <MailOpen size={22} className="text-violet-400" />
                  </div>
                  <p className="text-slate-700 font-medium">
                    {search ? "No results" : `${activeFolder} is empty`}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {search ? "Try different keywords" : "New messages will appear here"}
                  </p>
                </div>
              )}

              {!isLoading && !error && filtered.length > 0 && (
                <div>
                  {filtered.map((email) => (
                    <EmailCard
                      key={email.messageId}
                      email={email}
                      accountId={account?.accountId || accountId || ""}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isLoading && !error && filtered.length > 0 && (
              <p className="text-center text-xs text-slate-400 mt-3">
                {filtered.length} of {emails.length} messages
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
