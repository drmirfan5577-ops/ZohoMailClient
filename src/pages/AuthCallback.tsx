// OAuth redirect callback is no longer used.
// All authentication now happens directly via the Client ID + Client Secret + Grant Token form.
// This route is kept as a safety redirect in case old bookmarks or links point here.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/auth", { replace: true });
  }, [navigate]);
  return null;
}
