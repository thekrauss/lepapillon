"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  ShoppingBag,
  Menu,
  X,
  User,
  ChefHat,
  LogOut,
  LayoutDashboard,
  UserCircle,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useLogout } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const navLinks = [
  { label: "Boutique", href: "/boutique" },
  { label: "Prestation Chef", href: "/prestation-chef", icon: ChefHat },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

export default function   Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { accessToken, role, hasHydrated } = useAuthStore();
  const cart = useCartStore((s) => s.cart);
  const logout = useLogout();

  const isLoggedIn = hasHydrated && !!accessToken;
  const isAdmin = role === "admin";
  const cartCount = cart?.item_count ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout.mutate(undefined, {
      onSettled: () => router.push("/"),
    });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* glass bar */}
      <div className="border-b border-st-gold/10 bg-[var(--st-cream)]/80 backdrop-blur-xl">
        <nav className="st-section flex h-16 items-center justify-between lg:h-[72px]">
          {/* ── logo ──────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-st-gold text-white">
              <ChefHat className="h-5 w-5" />
            </span>
            <span className="font-serif text-xl font-bold tracking-tight text-st-charcoal">
              Saveurs<span className="text-st-gold">Thaï</span>
            </span>
          </Link>

          {/* ── desktop nav ───────────────────────────────────── */}
          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-st-charcoal/70 transition-colors hover:bg-st-gold/8 hover:text-st-charcoal"
                >
                  {l.icon && <l.icon className="h-3.5 w-3.5 text-st-gold" />}
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ── right actions ─────────────────────────────────── */}
          <div className="flex items-center gap-2">
            {/* User menu / Connexion */}
            {isLoggedIn ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-st-charcoal/70 transition-colors hover:text-st-charcoal sm:flex"
                >
                  <UserCircle className="h-4 w-4" />
                  Mon compte
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-card shadow-lg"
                    >
                      <div className="py-1">
                        <Link
                          href="/compte"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-st-charcoal/80 transition-colors hover:bg-st-gold/8"
                        >
                          <User className="h-4 w-4 text-st-gold/70" />
                          Mon profil
                        </Link>
                        <Link
                          href="/compte/commandes"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-st-charcoal/80 transition-colors hover:bg-st-gold/8"
                        >
                          <Package className="h-4 w-4 text-st-gold/70" />
                          Mes commandes
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-st-charcoal/80 transition-colors hover:bg-st-gold/8"
                          >
                            <LayoutDashboard className="h-4 w-4 text-st-gold/70" />
                            Administration
                          </Link>
                        )}
                        <div className="my-1 border-t border-[var(--border)]" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Deconnexion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/connexion"
                className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-st-charcoal/70 transition-colors hover:text-st-charcoal sm:flex"
              >
                <User className="h-4 w-4" />
                Connexion
              </Link>
            )}

            <Link
              href="/panier"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-st-gold/15 bg-white text-st-charcoal transition-colors hover:border-st-gold/30"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-st-gold text-[10px] font-bold text-white">
                {cartCount}
              </span>
            </Link>

            {/* mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-st-gold/15 bg-white lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X className="h-[18px] w-[18px]" />
              ) : (
                <Menu className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* ── mobile drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-b border-st-gold/10 bg-[var(--st-cream)]/95 backdrop-blur-xl lg:hidden"
          >
            <ul className="st-section flex flex-col gap-1 py-4">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-st-charcoal/80 transition-colors hover:bg-st-gold/8"
                  >
                    {l.icon && <l.icon className="h-4 w-4 text-st-gold" />}
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-st-gold/10 pt-3">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/compte"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-st-charcoal/80"
                    >
                      <UserCircle className="h-4 w-4 text-st-gold" />
                      Mon compte
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-st-charcoal/80"
                      >
                        <LayoutDashboard className="h-4 w-4 text-st-gold" />
                        Administration
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Deconnexion
                    </button>
                  </>
                ) : (
                  <Link
                    href="/connexion"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-st-charcoal/80"
                  >
                    <User className="h-4 w-4 text-st-gold" />
                    Connexion
                  </Link>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
