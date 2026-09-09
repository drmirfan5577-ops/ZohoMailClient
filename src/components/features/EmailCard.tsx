import { useNavigate } from "react-router-dom";
import { Paperclip, Circle } from "lucide-react";
import type { ZohoEmail } from "@/types/email";
import { cn } from "@/lib/utils";

interface EmailCardProps {
  email: ZohoEmail;
  accountId: string;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const ms = Number(dateStr);
  const date = isNaN(ms) ? new Date(dateStr) : new Date(ms);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(from: string): string {
  const name = from.split("<")[0].trim();
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(from: string): string {
  const colors = [
    "from-violet-400 to-purple-500",
    "from-blue-400 to-indigo-500",
    "from-emerald-400 to-teal-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-sky-500",
  ];
  const hash = from.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function EmailCard({ email, accountId }: EmailCardProps) {
  const navigate = useNavigate();
  const isUnread = email.status === "unread" || !email.isRead;

  return (
    <button
      onClick={() => navigate(`/email/${accountId}/${email.messageId}`)}
      className={cn(
        "w-full text-left group relative rounded-2xl border transition-all duration-200 px-4 py-3.5 mb-2",
        "hover:shadow-lg hover:shadow-violet-100/60 hover:-translate-y-0.5",
        isUnread
          ? "bg-white border-violet-100 shadow-sm shadow-violet-50"
          : "bg-white/60 border-white/80 hover:bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold shadow-sm",
            getAvatarColor(email.fromAddress)
          )}
        >
          {getInitials(email.fromAddress)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {isUnread && (
                <Circle
                  size={7}
                  className="fill-violet-500 text-violet-500 flex-shrink-0 mt-0.5"
                />
              )}
              <span
                className={cn(
                  "text-sm truncate",
                  isUnread
                    ? "font-semibold text-slate-800"
                    : "font-medium text-slate-600"
                )}
              >
                {email.fromAddress.split("<")[0].trim() || email.fromAddress}
              </span>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
              {formatTime(email.receivedTime || email.sentDateInGMT)}
            </span>
          </div>

          <p
            className={cn(
              "text-sm mt-0.5 truncate",
              isUnread ? "font-medium text-slate-700" : "text-slate-500"
            )}
          >
            {email.subject || "(No Subject)"}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-400 truncate flex-1">
              {email.summary}
            </p>
            {email.hasAttachment && (
              <Paperclip size={12} className="text-slate-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Hover accent */}
      <div className="absolute inset-y-0 left-0 w-0.5 rounded-l-2xl bg-gradient-to-b from-violet-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
