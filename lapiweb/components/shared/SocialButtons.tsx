"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import * as authDAL from "@/DAL/auth";

const REDIRECT_URI = typeof window !== "undefined" ? `${window.location.origin}/connexion` : "";

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

interface Props {
  label?: string;
}

export default function SocialButtons({ label = "ou continuer avec" }: Props) {
  const [loading, setLoading] = useState<"google" | "facebook" | null>(null);

  const handleSocial = async (provider: "google" | "facebook") => {
    setLoading(provider);
    try {
      const res = await authDAL.getSocialLoginURL(provider, REDIRECT_URI);
      window.location.href = res.data.url;
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="mt-6">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-[var(--st-warm-gray)]">{label}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSocial("google")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white py-3 text-[13px] font-semibold transition-all hover:border-[var(--foreground)]/20 hover:shadow-sm disabled:opacity-50"
        >
          {loading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Google
        </button>

        <button
          onClick={() => handleSocial("facebook")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white py-3 text-[13px] font-semibold transition-all hover:border-[#1877F2]/30 hover:shadow-sm disabled:opacity-50"
        >
          {loading === "facebook" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FacebookIcon />
          )}
          Facebook
        </button>
      </div>
    </div>
  );
}
