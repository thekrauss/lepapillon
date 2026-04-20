"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUpdateProduct } from "@/hooks/useAdmin";
import { useProducts, useCategories } from "@/hooks/useCatalogue";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditProduitPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const updateProduct = useUpdateProduct();

  const product = products?.find((p) => p.id === id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [isKit, setIsKit] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setPrice((product.price / 100).toFixed(2));
      setStock(String(product.stock));
      setImageUrl(product.image_url ?? "");
      setIsKit(product.is_kit);
      setIsActive(product.is_active);
      setIsFeatured(product.is_featured);
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate(
      {
        id,
        data: {
          name,
          description,
          price: Math.round(parseFloat(price) * 100),
          stock: parseInt(stock),
          image_url: imageUrl || undefined,
          is_kit: isKit,
          is_active: isActive,
          is_featured: isFeatured,
        },
      },
      { onSuccess: () => router.push("/admin/produits") }
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/admin/produits" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
          <ArrowLeft className="h-3.5 w-3.5" /> Produits
        </Link>
        <p className="text-[var(--st-warm-gray)]">Produit introuvable.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin/produits" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Produits
      </Link>
      <h1 className="font-sans text-2xl font-bold">Éditer — {product.name}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="st-card space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Nom du produit *</label>
            <input
              type="text" required className="st-input w-full"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Description</label>
            <textarea
              className="st-input min-h-[120px] w-full resize-y"
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Prix (€) *</label>
              <input
                type="number" step="0.01" min="0" required className="st-input w-full"
                value={price} onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Stock</label>
              <input
                type="number" min="0" className="st-input w-full"
                value={stock} onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Catégorie actuelle</label>
            <p className="text-[13px] text-[var(--st-warm-gray)]">{product.category?.name ?? "—"}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">URL image</label>
            <input
              type="url" className="st-input w-full" placeholder="https://…"
              value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input id="is-kit" type="checkbox" className="h-4 w-4 accent-st-gold" checked={isKit} onChange={(e) => setIsKit(e.target.checked)} />
              <label htmlFor="is-kit" className="text-[13px] font-medium">Kit (préparation à domicile)</label>
            </div>
            <div className="flex items-center gap-3">
              <input id="is-active" type="checkbox" className="h-4 w-4 accent-st-gold" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <label htmlFor="is-active" className="text-[13px] font-medium">Produit actif (visible en boutique)</label>
            </div>
            <div className="flex items-center gap-3">
              <input id="is-featured" type="checkbox" className="h-4 w-4 accent-st-gold" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <label htmlFor="is-featured" className="text-[13px] font-medium">Produit vedette (affiché en page d&apos;accueil)</label>
            </div>
          </div>
        </div>

        {updateProduct.isError && (
          <p className="text-[13px] text-red-600">Erreur lors de la mise à jour.</p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={updateProduct.isPending} className="st-btn-primary py-3.5 px-10 disabled:opacity-50">
            {updateProduct.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" />Sauvegarde...</> : "Enregistrer"}
          </button>
          <Link href="/admin/produits" className="st-btn-secondary py-3.5">Annuler</Link>
        </div>
      </form>
    </div>
  );
}
