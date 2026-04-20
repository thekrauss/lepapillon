"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCreateProduct } from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/useCatalogue";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function NouveauProduitPage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isKit, setIsKit] = useState(false);
  const [isFeatured] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(
      {
        name,
        slug: slugify(name),
        description,
        price: Math.round(parseFloat(price) * 100),
        category_id: categoryId,
        image_url: imageUrl || undefined,
        stock: parseInt(stock),
        is_kit: isKit,
      },
      { onSuccess: () => router.push("/admin/produits") }
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin/produits" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Produits
      </Link>
      <h1 className="font-sans text-2xl font-bold">Nouveau produit</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="st-card space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Nom du produit *</label>
            <input
              type="text" required className="st-input w-full" placeholder="Ex : Kit Pad Thaï"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Description</label>
            <textarea
              className="st-input min-h-[120px] w-full resize-y" placeholder="Description détaillée…"
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Prix (€) *</label>
              <input
                type="number" step="0.01" min="0" required className="st-input w-full" placeholder="0.00"
                value={price} onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Stock</label>
              <input
                type="number" min="0" className="st-input w-full" placeholder="0"
                value={stock} onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Catégorie *</label>
            <select
              required className="st-input w-full"
              value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Choisir une catégorie</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">URL image</label>
            <input
              type="url" className="st-input w-full" placeholder="https://…"
              value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="is-kit" type="checkbox" className="h-4 w-4 accent-st-gold"
              checked={isKit} onChange={(e) => setIsKit(e.target.checked)}
            />
            <label htmlFor="is-kit" className="text-[13px] font-medium">Produit vendu comme kit (préparation à domicile)</label>
          </div>
        </div>

        {createProduct.isError && (
          <p className="text-[13px] text-red-600">Erreur lors de la création du produit.</p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={createProduct.isPending} className="st-btn-primary py-3.5 px-10 disabled:opacity-50">
            {createProduct.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" />Création...</> : "Créer le produit"}
          </button>
          <Link href="/admin/produits" className="st-btn-secondary py-3.5">Annuler</Link>
        </div>
      </form>
    </div>
  );
}
