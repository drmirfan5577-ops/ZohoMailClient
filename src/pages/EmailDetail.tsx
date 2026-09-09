import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Reply, Paperclip, Calendar, User, AtSign, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { fetchEmailContent } from "@/lib/zoho";
import { useZohoAuth } from "@/hooks/useZohoAuth";
import type { ZohoEmailContent } from "@/types/email";
import { toast } from "sonner";

function formatFullDate(dateStr: string): string {
  if (!dateStr) return "";
  const ms = Number(dateStr);
  const date = isNaN(ms) ? new Date(dateStr) : new Date(ms);
  return date.toLocaleString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmailDetail() {
  const { accountId, messageId } = useParams<{ accountId: string; messageId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useZohoAuth();
  const [email, setEmail] = useState<ZohoEmailContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (!accountId || !messageId) return;

    const load = async () => {
      setIsLoading(true);
      const data = await fetchEmailContent(accountId, messageId);
      setEmail(data);
      setIsLoading(false);
    };

    load().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to load email";
      toast.error(msg);
      setIsLoading(false);
    });
  }, [accountId, messageId, isAuthenticated, navigate]);

  const handleReply = () => {
    if (!email) return;
    const replyTo = encodeURIComponent(email.fromAddress);
    const replySubject = encodeURIComponent(`Re: ${email.subject}`);
    navigate(`/compose?to=${replyTo}&subject=${replySubject}`);
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-violet-50/60 to-indigo-50/80 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(167,139,250,0.12)_0%,_transparent_55%)] -z-10" />

      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/inbox")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Inbox
        </button>

        {isLoading && (
          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-xl shadow-violet-100/40 p-10 text-center">
            <Loader className="text-violet-400 animate-spin mx-auto mb-3" size={32} />
            <p className="text-slate-500">Loading email…</p>
          </div>
        )}

        {!isLoading && email && (
          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-xl shadow-violet-100/40 overflow-hidden">
            {/* Email header */}
            <div className="px-6 pt-6 pb-5 border-b border-slate-100/80 bg-gradient-to-br from-violet-50/40 to-indigo-50/30">
              <h1 className="text-xl font-bold text-slate-800 mb-4 leading-snug">
                {email.subject || "(No Subject)"}
              </h1>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">From</p>
                    <p className="text-sm text-slate-700 truncate font-medium">{email.fromAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <AtSign size={14} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">To</p>
                    <p className="text-sm text-slate-700 truncate">{email.toAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date</p>
                    <p className="text-sm text-slate-700">{formatFullDate(email.receivedTime || email.sentDateInGMT)}</p>
                  </div>
                </div>

                {email.hasAttachment && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Paperclip size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Attachments</p>
                      <p className="text-sm text-slate-700">This email has attachments</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Email body */}
            <div className="px-6 py-6">
              {email.htmlContent ? (
                <div
                  className="prose prose-slate max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: email.htmlContent }}
                />
              ) : (
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {email.content || email.summary || "(No content)"}
                </pre>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 pb-6 pt-2 flex gap-2">
              <Button
                onClick={handleReply}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md shadow-violet-200 gap-2"
              >
                <Reply size={15} />
                Reply
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/compose")}
                className="rounded-xl border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600"
              >
                New Email
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
