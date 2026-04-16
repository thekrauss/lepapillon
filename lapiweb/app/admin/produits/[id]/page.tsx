import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

export const metadata: Metadata = { title: "Éditer produit — Admin Saveurs Thaï" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProduitPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin/produits" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Produits
      </Link>
      <h1 className="font-sans text-2xl font-bold">Éditer le produit #{id}</h1>

      <form className="space-y-6">
        <div className="st-card space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Nom du produit</label>
            <input type="text" className="st-input w-full" defaultValue="Kit Pad Thaï" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Description</label>
            <textarea className="st-input min-h-[120px] w-full resize-y" defaultValue="Nouilles de riz, sauce tamarin, cacahuètes…" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Prix (€)</label>
              <input type="number" step="0.01" className="st-input w-full" defaultValue="25.00" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Stock</label>
              <input type="number" className="st-input w-full" defaultValue="42" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Catégorie</label>
            <select className="st-input w-full" defaultValue="Kits">
              <option>Kits</option>
              <option>Sauces</option>
              <option>Épices</option>
              <option>Ingrédients</option>
            </select>
          </div>
        </div>

        <div className="st-card">
          <label className="mb-3 block text-[13px] font-semibold">Images</label>
          <div className="flex h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] transition-colors hover:border-st-gold/30">
            <div className="text-center">
              <Upload className="mx-auto h-6 w-6 text-[var(--st-warm-gray)]" />
              <p className="mt-2 text-[12px] text-[var(--st-warm-gray)]">Ajouter des images</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="st-btn-primary py-3.5 px-10">Enregistrer</button>
          <Link href="/admin/produits" className="st-btn-secondary py-3.5">Annuler</Link>
        </div>
      </form>
    </div>
  );
}
