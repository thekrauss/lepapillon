"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, accessToken, router, pathname]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  if (!accessToken) return null;

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, role, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken) {
      router.replace("/connexion?redirect=/admin");
    } else if (role !== "admin") {
      router.replace("/");
    }
  }, [hasHydrated, accessToken, role, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  if (!accessToken || role !== "admin") return null;

  return <>{children}</>;
}
