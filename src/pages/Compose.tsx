import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Send, X, CheckCircle, Bold, Italic, Underline, List,
  ListOrdered, Link2, Trash2, Paperclip, FileText, Image, Eye, Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import FolderSidebar from "@/components/features/FolderSidebar";
import { sendEmail, fetchAccounts, getCachedAccount } from "@/lib/zoho";
import { useZohoAuth } from "@/hooks/useZohoAuth";
import { FOLDER_NAMES } from "@/constants/zoho";
import type { AttachmentFile } from "@/types/email";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix, keep only base64 content
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  return FileText;
}

type ToolbarCmd =
  | "bold" | "italic" | "underline" | "strikeThrough"
  | "insertUnorderedList" | "insertOrderedList" | "removeFormat";

export default function Compose() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, accountId: authAccountId } = useZohoAuth();

  const [to, setTo] = useState(searchParams.get("to") || "");
  const [subject, setSubject] = useState(searchParams.get("subject") || "");
  const [accountId, setAccountId] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/auth");
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const cached = getCachedAccount();
    if (cached.accountId) {
      setAccountId(cached.accountId);
      return;
    }
    fetchAccounts()
      .then((accounts) => {
        const primary = accounts.find((a) => a.isPrimary) || accounts[0];
        if (primary) setAccountId(primary.accountId);
      })
      .catch(console.error);
  }, [isAuthenticated]);

  // Pre-fill reply body from URL params
  useEffect(() => {
    const body = searchParams.get("body");
    if (body && editorRef.current) {
      editorRef.current.innerHTML = body;
    }
  }, []);

  const execCmd = useCallback((cmd: ToolbarCmd, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt("Enter URL:", "https://");
    if (url) execCmd("insertUnorderedList" as ToolbarCmd); // reset
    if (url) document.execCommand("createLink", false, url);
  }, []);

  const toggleHtmlMode = () => {
    if (!htmlMode) {
      setHtmlSource(editorRef.current?.innerHTML || "");
      setHtmlMode(true);
    } else {
      if (editorRef.current) editorRef.current.innerHTML = htmlSource;
      setHtmlMode(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB per file
    const tooBig = files.filter((f) => f.size > MAX_SIZE);
    if (tooBig.length > 0) {
      toast.error(`File too large: ${tooBig[0].name} (max 10 MB)`);
      return;
    }

    const newAtts: AttachmentFile[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type || "application/octet-stream",
        data: await fileToBase64(file),
        size: file.size,
      }))
    );

    setAttachments((prev) => [...prev, ...newAtts]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getBodyHtml = (): string => {
    if (htmlMode) return htmlSource;
    return editorRef.current?.innerHTML || "";
  };

  const handleSend = async () => {
    if (!to.trim()) { toast.error("Please enter a recipient"); return; }
    if (!subject.trim()) { toast.error("Please enter a subject"); return; }
    const content = getBodyHtml();
    if (!content || content === "<br>" || content.trim() === "") {
      toast.error("Please write your message");
      return;
    }
    if (!accountId) { toast.error("Account not loaded yet, please wait"); return; }

    setIsSending(true);
    await sendEmail(accountId, to.trim(), subject.trim(), content, attachments);
    setSent(true);
    toast.success("Email sent successfully!");
    setIsSending(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-violet-50/60 to-indigo-50/80 -z-10" />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-5">
          <div className="hidden lg:block">
            <FolderSidebar
              activeFolder={FOLDER_NAMES.INBOX}
              onSelectFolder={() => navigate("/inbox")}
              folders={[]}
            />
          </div>
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="bg-white/75 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-2xl shadow-violet-100/50 p-12 max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
                <CheckCircle className="text-white" size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Email Sent!</h2>
              <p className="text-slate-500 mt-2">
                Delivered to <strong className="text-slate-700">{to}</strong>
              </p>
              {attachments.length > 0 && (
                <p className="text-slate-400 text-sm mt-1">{attachments.length} attachment{attachments.length !== 1 ? "s" : ""} included</p>
              )}
              <div className="flex gap-3 justify-center mt-8">
                <Button
                  onClick={() => { setTo(""); setSubject(""); setAttachments([]); setSent(false); if (editorRef.current) editorRef.current.innerHTML = ""; }}
                  variant="outline"
                  className="rounded-xl border-slate-200 hover:border-violet-300 hover:text-violet-600"
                >
                  Compose Another
                </Button>
                <Button
                  onClick={() => navigate("/inbox")}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700"
                >
                  Back to Inbox
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-violet-50/60 to-indigo-50/80 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(167,139,250,0.12)_0%,_transparent_60%)] -z-10" />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-5">
          {/* Sidebar */}
          <div className="hidden lg:block">
            <FolderSidebar
              activeFolder={FOLDER_NAMES.INBOX}
              onSelectFolder={(f) => { navigate("/inbox"); }}
              folders={[]}
            />
          </div>

          {/* Compose area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white/75 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-xl shadow-violet-100/40 overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100/80 bg-gradient-to-r from-violet-50/50 to-indigo-50/40">
                <span className="text-sm font-semibold text-slate-700">New Message</span>
                <button
                  onClick={() => navigate("/inbox")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Header fields */}
              <div className="px-5 pt-4 pb-2 space-y-3 border-b border-slate-100/80">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-12 flex-shrink-0">To</span>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="flex-1 h-9 bg-transparent border-none shadow-none focus:ring-0 focus:border-none text-sm text-slate-800 placeholder:text-slate-300 px-0"
                  />
                </div>
                <div className="flex items-center gap-3 border-t border-slate-100/80 pt-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-12 flex-shrink-0">Subject</span>
                  <Input
                    placeholder="Email subject…"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1 h-9 bg-transparent border-none shadow-none focus:ring-0 focus:border-none text-sm font-medium text-slate-800 placeholder:text-slate-300 px-0"
                  />
                </div>
              </div>

              {/* Rich text toolbar */}
              <div className="flex items-center gap-0.5 px-4 py-2 border-b border-slate-100/60 bg-slate-50/50 flex-wrap">
                {[
                  { icon: Bold, cmd: "bold" as ToolbarCmd, title: "Bold" },
                  { icon: Italic, cmd: "italic" as ToolbarCmd, title: "Italic" },
                  { icon: Underline, cmd: "underline" as ToolbarCmd, title: "Underline" },
                ].map(({ icon: Icon, cmd, title }) => (
                  <button
                    key={cmd}
                    onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
                    title={title}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition-all"
                  >
                    <Icon size={15} />
                  </button>
                ))}

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <button
                  onMouseDown={(e) => { e.preventDefault(); execCmd("insertUnorderedList"); }}
                  title="Bullet List"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition-all"
                >
                  <List size={15} />
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); execCmd("insertOrderedList"); }}
                  title="Numbered List"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition-all"
                >
                  <ListOrdered size={15} />
                </button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <button
                  onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
                  title="Insert Link"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition-all"
                >
                  <Link2 size={15} />
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); execCmd("removeFormat"); }}
                  title="Clear Formatting"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition-all"
                >
                  <Trash2 size={13} />
                </button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <button
                  onClick={toggleHtmlMode}
                  title="Toggle HTML Source"
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-all",
                    htmlMode
                      ? "bg-violet-600 text-white"
                      : "text-slate-500 hover:bg-violet-100 hover:text-violet-700"
                  )}
                >
                  <Code size={13} />
                  HTML
                </button>
              </div>

              {/* Editor / HTML source */}
              <div className="px-5 py-4 min-h-[280px]">
                {htmlMode ? (
                  <textarea
                    value={htmlSource}
                    onChange={(e) => setHtmlSource(e.target.value)}
                    className="w-full h-64 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20"
                    placeholder="<p>Your HTML email content...</p>"
                  />
                ) : (
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="w-full min-h-[240px] text-sm text-slate-700 leading-relaxed focus:outline-none prose max-w-none"
                    style={{ wordBreak: "break-word" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        // Default browser behavior handles new lines
                      }
                    }}
                    data-placeholder="Write your message here…"
                  />
                )}
              </div>

              {/* Attachments list */}
              {attachments.length > 0 && (
                <div className="px-5 pb-3 flex flex-wrap gap-2">
                  {attachments.map((att, i) => {
                    const Icon = getFileIcon(att.type);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-xs text-violet-700 font-medium max-w-[200px]"
                      >
                        <Icon size={13} className="flex-shrink-0" />
                        <span className="truncate">{att.name}</span>
                        <span className="text-violet-400 flex-shrink-0">({formatFileSize(att.size)})</span>
                        <button
                          onClick={() => removeAttachment(i)}
                          className="text-violet-400 hover:text-rose-500 transition-colors flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer actions */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-violet-50/30">
                <div className="flex items-center gap-1">
                  {/* Attach file button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                    className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition-all text-sm font-medium"
                  >
                    <Paperclip size={15} />
                    <span className="hidden sm:inline">Attach</span>
                    {attachments.length > 0 && (
                      <span className="bg-violet-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {attachments.length}
                      </span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/inbox")}
                    className="rounded-xl border-slate-200 text-slate-500 hover:border-slate-300 h-9"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={isSending}
                    size="sm"
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-violet-200 gap-1.5 px-5 h-9"
                  >
                    <Send size={14} />
                    {isSending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Editor placeholder style */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #cbd5e1;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
