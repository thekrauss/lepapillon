"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChefHat, LayoutDashboard, Package, Tag, ShoppingBag,
  CalendarDays, Users, Settings, ArrowLeft, LogOut, Search, Menu, X,
} from "lucide-react";
import { AdminGuard } from "@/components/shared/AuthGuard";
import { useProfile, useLogout } from "@/hooks/useAuth";
import CommandPalette from "@/components/admin/CommandPalette";

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Package, label: "Produits", href: "/admin/produits" },
  { icon: Tag, label: "Categories", href: "/admin/categories" },
  { icon: ShoppingBag, label: "Commandes", href: "/admin/commandes" },
  { icon: CalendarDays, label: "Prestations", href: "/admin/prestations" },
  { icon: Users, label: "Clients", href: "/admin/clients" },
  { icon: Settings, label: "Parametres", href: "/admin/parametres" },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/produits": "Produits",
  "/admin/produits/nouveau": "Nouveau produit",
  "/admin/categories": "Categories",
  "/admin/commandes": "Commandes",
  "/admin/prestations": "Prestations",
  "/admin/clients": "Clients",
  "/admin/parametres": "Parametres",
  "/admin/profil": "Mon profil",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useProfile();
  const logout = useLogout();

  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => router.push("/connexion"),
    });
  };

  const pageTitle = pageTitles[pathname] ?? "Admin";

  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        {/* ── sidebar (desktop) ───────────────────────────── */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-[var(--border)] bg-card lg:flex lg:flex-col">
          <div className="flex h-14 items-center gap-2.5 border-b border-[var(--border)] px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-st-gold text-white">
              <ChefHat className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg font-bold">
              Saveurs<span className="text-st-gold">Thai</span>
            </span>
          </div>

          <nav className="flex-1 space-y-0.5 p-3">
            {sidebarLinks.map((l) => {
              const isActive = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-st-gold/10 text-st-gold-hover"
                      : "text-[var(--foreground)]/70 hover:bg-st-gold/8 hover:text-[var(--foreground)]"
                  }`}
                >
                  <l.icon className={`h-4 w-4 ${isActive ? "text-st-gold" : "text-st-gold/70"}`} />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* bottom */}
          <div className="border-t border-[var(--border)] p-3 space-y-1">
            {profile && (
              <Link
                href="/admin/profil"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-colors hover:bg-st-gold/8"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-st-gold/10 text-[11px] font-bold text-st-gold">
                  {(profile.first_name?.[0] ?? profile.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold">
                    {profile.first_name || profile.email.split("@")[0]}
                  </p>
                  <p className="truncate text-[10px] text-[var(--st-warm-gray)]">{profile.email}</p>
                </div>
              </Link>
            )}
            <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-[var(--st-warm-gray)] transition-colors hover:text-st-gold">
              <ArrowLeft className="h-4 w-4" /> Retour au site
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Deconnexion
            </button>
          </div>
        </aside>

        {/* ── main area ───────────────────────────────────── */}
        <div className="flex flex-1 flex-col">
          {/* ── top header ────────────────────────────────── */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[var(--border)] bg-card/80 px-4 backdrop-blur-xl lg:px-8">
            {/* mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {/* page title */}
            <h2 className="text-[14px] font-semibold lg:text-[15px]">{pageTitle}</h2>

            <div className="flex-1" />

            {/* search trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-1.5 text-[13px] text-[var(--st-warm-gray)] transition-colors hover:border-st-gold/30 hover:bg-[var(--muted)]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Rechercher...</span>
              <kbd className="hidden rounded-md border border-[var(--border)] bg-card px-1.5 py-0.5 text-[10px] font-semibold sm:inline">
                Ctrl K
              </kbd>
            </button>

            {/* avatar */}
            {profile && (
              <Link href="/admin/profil" className="flex h-8 w-8 items-center justify-center rounded-full bg-st-gold/10 text-[11px] font-bold text-st-gold">
                {(profile.first_name?.[0] ?? profile.email[0]).toUpperCase()}
              </Link>
            )}
          </header>

          {/* ── mobile nav drawer ─────────────────────────── */}
          {mobileMenuOpen && (
            <div className="border-b border-[var(--border)] bg-card p-3 lg:hidden">
              <nav className="space-y-0.5">
                {sidebarLinks.map((l) => {
                  const isActive = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                        isActive ? "bg-st-gold/10 text-st-gold-hover" : "text-[var(--foreground)]/70"
                      }`}
                    >
                      <l.icon className="h-4 w-4 text-st-gold/70" />
                      {l.label}
                    </Link>
                  );
                })}
                <div className="mt-2 border-t border-[var(--border)] pt-2">
                  <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-[var(--st-warm-gray)]">
                    <ArrowLeft className="h-4 w-4" /> Retour au site
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-red-600">
                    <LogOut className="h-4 w-4" /> Deconnexion
                  </button>
                </div>
              </nav>
            </div>
          )}

          {/* ── page content ──────────────────────────────── */}
          <main className="flex-1 p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* ── command palette ────────────────────────────── */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </AdminGuard>
  );
}
