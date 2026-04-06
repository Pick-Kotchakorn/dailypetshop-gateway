import { Outlet } from "react-router";
import { useEffect } from "react";

export function AppRoot() {
  useEffect(() => {
    // Dynamically inject LIFF script
    if (!document.querySelector('script[src="https://static.line-scdn.net/liff/edge/2/sdk.js"]')) {
      const script = document.createElement("script");
      script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf6f5] text-[#4A3F35] font-['Kanit',sans-serif] flex justify-center py-6 px-4">
      <div className="w-full max-w-[480px]">
        <Outlet />
      </div>
    </div>
  );
}
