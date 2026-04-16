"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Package, Loader2 } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useCatalogue";
import { useDeleteProduct } from "@/hooks/useAdmin";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function AdminProduitsPage() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const deleteProduct = useDeleteProduct();

  const filtered = products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Produits</h1>
          <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">{filtered.length} produits</p>
        </div>
        <Link href="/admin/produits/nouveau" className="st-btn-primary gap-1.5 text-[13px]">
          <Plus className="h-4 w-4" /> Nouveau produit
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="st-input w-full pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
        </div>
      ) : (
        <div className="st-card overflow-x-auto p-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                <th className="px-5 py-3">Produit</th>
                <th className="px-5 py-3">Categorie</th>
                <th className="px-5 py-3">Prix</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)]">
                        <Package className="h-4 w-4 text-[var(--st-warm-gray)]" />
                      </div>
                      <div>
                        <span className="font-semibold">{p.name}</span>
                        {p.is_kit && (
                          <span className="ml-2 rounded-full bg-st-gold/10 px-2 py-0.5 text-[10px] font-bold text-st-gold">KIT</span>
                        )}
                        {p.is_featured && (
                          <span className="ml-1 rounded-full bg-st-forest/10 px-2 py-0.5 text-[10px] font-bold text-st-forest">VEDETTE</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--st-warm-gray)]">{p.category?.name ?? "-"}</td>
                  <td className="px-5 py-4 font-semibold">{fmt(p.price)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${p.stock < 20 ? "bg-red-50 text-red-600" : "bg-st-forest/10 text-st-forest"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${p.is_active ? "bg-st-forest/10 text-st-forest" : "bg-gray-100 text-gray-500"}`}>
                      {p.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/produits/${p.id}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--st-warm-gray)] hover:text-st-gold">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer "${p.name}" ?`)) {
                            deleteProduct.mutate(p.id);
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--st-warm-gray)] hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--st-warm-gray)]">
                    Aucun produit trouve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
