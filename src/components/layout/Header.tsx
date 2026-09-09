import { useNavigate, useLocation } from "react-router-dom";
import { Mail, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZohoAuth } from "@/hooks/useZohoAuth";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const navigate = useNavigate();
  const { logout, accountEmail } = useZohoAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 backdrop-blur-xl bg-white/70 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("/inbox")}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
              <Mail size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                ZohoMail
              </span>
              {accountEmail && (
                <span className="ml-2 text-xs text-slate-400 font-normal">{accountEmail}</span>
              )}
            </div>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                title="Refresh"
              >
                <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-500 hover:bg-red-50 gap-1.5"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline text-sm">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
