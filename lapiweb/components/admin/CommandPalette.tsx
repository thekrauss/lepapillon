"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  CalendarDays,
  Users,
  Settings,
  ArrowLeft,
  Hash,
} from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useCatalogue";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  group: string;
}

const staticCommands: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin", group: "Pages" },
  { id: "produits", label: "Produits", icon: Package, href: "/admin/produits", group: "Pages" },
  { id: "categories", label: "Categories", icon: Tag, href: "/admin/categories", group: "Pages" },
  { id: "commandes", label: "Commandes", icon: ShoppingBag, href: "/admin/commandes", group: "Pages" },
  { id: "prestations", label: "Prestations", icon: CalendarDays, href: "/admin/prestations", group: "Pages" },
  { id: "clients", label: "Clients", icon: Users, href: "/admin/clients", group: "Pages" },
  { id: "parametres", label: "Parametres", icon: Settings, href: "/admin/parametres", group: "Pages" },
  { id: "nouveau-produit", label: "Nouveau produit", description: "Creer un produit", icon: Package, href: "/admin/produits/nouveau", group: "Actions" },
  { id: "retour-site", label: "Retour au site", icon: ArrowLeft, href: "/", group: "Actions" },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: products } = useProducts();
  const { data: categories } = useCategories();

  const dynamicCommands = useMemo(() => {
    const items: CommandItem[] = [];
    products?.forEach((p) => {
      items.push({
        id: `product-${p.id}`,
        label: p.name,
        description: `${(p.price / 100).toFixed(2)} EUR — ${p.category?.name ?? ""}`,
        icon: Package,
        href: `/admin/produits/${p.id}`,
        group: "Produits",
      });
    });
    categories?.forEach((c) => {
      items.push({
        id: `cat-${c.id}`,
        label: c.name,
        description: `/${c.slug}`,
        icon: Hash,
        href: "/admin/categories",
        group: "Categories",
      });
    });
    return items;
  }, [products, categories]);

  const allCommands = useMemo(() => [...staticCommands, ...dynamicCommands], [dynamicCommands]);

  const filtered = useMemo(() => {
    if (!query.trim()) return staticCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [query, allCommands]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [filtered.length]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const navigate = (item: CommandItem) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      navigate(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Group items
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return map;
  }, [filtered]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* search input */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
              <Search className="h-4 w-4 shrink-0 text-[var(--st-warm-gray)]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher une page, un produit..."
                className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--st-warm-gray)]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <kbd className="hidden rounded-md border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--st-warm-gray)] sm:inline">
                ESC
              </kbd>
            </div>

            {/* results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-[13px] text-[var(--st-warm-gray)]">
                  Aucun resultat pour &quot;{query}&quot;
                </p>
              ) : (
                <>
                  {(() => {
                    let globalIdx = 0;
                    return Array.from(grouped.entries()).map(([group, items]) => (
                      <div key={group}>
                        <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                          {group}
                        </p>
                        {items.map((item) => {
                          const idx = globalIdx++;
                          return (
                            <button
                              key={item.id}
                              data-index={idx}
                              onClick={() => navigate(item)}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors ${
                                idx === activeIndex ? "bg-st-gold/10 text-st-gold-hover" : "text-[var(--foreground)]/80 hover:bg-[var(--muted)]"
                              }`}
                            >
                              <item.icon className={`h-4 w-4 shrink-0 ${idx === activeIndex ? "text-st-gold" : "text-[var(--st-warm-gray)]"}`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{item.label}</p>
                                {item.description && (
                                  <p className="truncate text-[11px] text-[var(--st-warm-gray)]">{item.description}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--st-warm-gray)]">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5 font-mono">↑↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5 font-mono">↵</kbd>
                ouvrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5 font-mono">esc</kbd>
                fermer
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
