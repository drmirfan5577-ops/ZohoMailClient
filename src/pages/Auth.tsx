import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, ArrowRight, Lock, KeyRound, ExternalLink, Info, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectWithGrantToken, getSavedClientId } from "@/lib/zoho";
import { ZOHO_CONFIG } from "@/constants/zoho";
import { toast } from "sonner";

const STEPS = [
  { n: 1, label: "Open Zoho API Console", link: "https://api-console.zoho.eu", action: "Create or open a Self Client application" },
  { n: 2, label: "Generate Grant Token", link: null, action: `Scope to enter: ${ZOHO_CONFIG.SCOPES}` },
  { n: 3, label: "Paste credentials below", link: null, action: "Enter Client ID, Client Secret & Grant Token" },
];

export default function Auth() {
  const navigate = useNavigate();

  const [clientId, setClientId] = useState(getSavedClientId());
  const [clientSecret, setClientSecret] = useState("");
  const [grantToken, setGrantToken] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showScopesCopied, setShowScopesCopied] = useState(false);

  const copyScopes = () => {
    navigator.clipboard.writeText(ZOHO_CONFIG.SCOPES);
    setShowScopesCopied(true);
    setTimeout(() => setShowScopesCopied(false), 2000);
  };

  const handleConnect = async () => {
    if (!clientId.trim()) { toast.error("Please enter your Client ID"); return; }
    if (!clientSecret.trim()) { toast.error("Please enter your Client Secret"); return; }
    if (!grantToken.trim()) { toast.error("Please enter your Grant Token"); return; }

    setIsConnecting(true);
    const result = await connectWithGrantToken(clientId.trim(), clientSecret.trim(), grantToken.trim())
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Connection failed");
        setIsConnecting(false);
        return null;
      });

    if (result) {
      toast.success(`Connected to ${result.accountEmail || "Zoho Mail"}!`);
      navigate("/inbox");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-violet-50/80 to-indigo-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(167,139,250,0.25)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.2)_0%,_transparent_60%)]" />
      <div className="absolute top-20 left-16 w-64 h-64 rounded-full bg-gradient-to-br from-violet-200/40 to-purple-200/30 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-16 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-200/40 to-cyan-200/30 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-300/50 mb-3">
            <Mail className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Zoho Mail Connect</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">No redirect URI needed — connect directly</p>
        </div>

        {/* Setup guide */}
        <div className="bg-white/70 backdrop-blur-sm border border-violet-100 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Info size={12} /> Quick Setup Guide
          </p>
          <div className="space-y-2.5">
            {STEPS.map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.n}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700">
                    {step.link ? (
                      <a href={step.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 underline underline-offset-2">
                        {step.label} <ExternalLink size={10} />
                      </a>
                    ) : step.label}
                  </p>
                  {step.n === 2 ? (
                    <div className="mt-1">
                      <p className="text-xs text-slate-500 mb-1">Copy these scopes into Zoho:</p>
                      <div className="flex items-center gap-1.5">
                        <code className="text-[10px] text-violet-600 bg-violet-50 border border-violet-100 px-2 py-1 rounded-lg flex-1 min-w-0 break-all font-mono leading-relaxed">
                          {ZOHO_CONFIG.SCOPES}
                        </code>
                        <button
                          onClick={copyScopes}
                          className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 text-xs font-medium transition-colors"
                        >
                          {showScopesCopied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5">{step.action}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credentials form */}
        <div className="bg-white/75 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-2xl shadow-violet-100/50 p-6">
          <div className="space-y-4">
            {/* Client ID */}
            <div className="space-y-1.5">
              <Label htmlFor="clientId" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <KeyRound size={13} className="text-violet-500" /> Client ID
              </Label>
              <Input
                id="clientId"
                placeholder="1000.XXXXXXXXXXXXXXXXXXXX"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="h-11 bg-white/80 border-slate-200 rounded-xl focus:border-violet-400 focus:ring-violet-400/20 placeholder:text-slate-300 font-mono text-sm"
              />
            </div>

            {/* Client Secret */}
            <div className="space-y-1.5">
              <Label htmlFor="clientSecret" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Lock size={13} className="text-violet-500" /> Client Secret
              </Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? "text" : "password"}
                  placeholder="••••••••••••••••••••"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="h-11 bg-white/80 border-slate-200 rounded-xl focus:border-violet-400 focus:ring-violet-400/20 pr-10 placeholder:text-slate-300 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Grant Token */}
            <div className="space-y-1.5">
              <Label htmlFor="grantToken" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Hash size={13} className="text-violet-500" /> Grant Token
                <span className="text-xs font-normal text-slate-400">(one-time, from Self Client)</span>
              </Label>
              <div className="relative">
                <Input
                  id="grantToken"
                  type={showToken ? "text" : "password"}
                  placeholder="1000.xxxxxxxxxxxx.xxxxxxxxxxxx"
                  value={grantToken}
                  onChange={(e) => setGrantToken(e.target.value)}
                  className="h-11 bg-white/80 border-slate-200 rounded-xl focus:border-violet-400 focus:ring-violet-400/20 pr-10 placeholder:text-slate-300 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                In Zoho API Console → Self Client → Generate Code → set duration to 10 min → paste here.
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all duration-200 gap-2 mt-1"
            >
              {isConnecting ? "Connecting…" : (<>Connect to Zoho Mail <ArrowRight size={16} /></>)}
            </Button>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100">
            <Lock size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-700 leading-relaxed">
              Tokens stored securely on <strong>OnSpace Cloud</strong>. Grant token is discarded after exchange — never stored.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Zoho API Console →{" "}
          <a href="https://api-console.zoho.eu/" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-700 underline">
            api-console.zoho.eu
          </a>
        </p>
      </div>
    </div>
  );
}
