import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionToken, getCachedAccount } from "@/lib/zoho";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getSessionToken();
    const { accountId } = getCachedAccount();
    if (token && accountId) {
      navigate("/inbox", { replace: true });
    } else {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50">
      <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
    </div>
  );
};

export default Index;
