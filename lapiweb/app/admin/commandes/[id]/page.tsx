import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package, User, MapPin, Truck } from "lucide-react";

export const metadata: Metadata = { title: "Détail commande — Admin Saveurs Thaï" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCommandeDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/commandes" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Commandes
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-bold">Commande #{id}</h1>
        <select className="st-input text-[13px]">
          <option>En préparation</option>
          <option>Expédiée</option>
          <option>Livrée</option>
          <option>Annulée</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* client */}
        <div className="st-card">
          <h2 className="flex items-center gap-2 font-sans text-[14px] font-bold">
            <User className="h-4 w-4 text-st-gold" /> Client
          </h2>
          <div className="mt-3 text-[13px] text-[var(--st-warm-gray)]">
            <p className="font-medium text-[var(--foreground)]">Marie Dupont</p>
            <p>marie@example.com</p>
            <p>06 12 34 56 78</p>
          </div>
        </div>

        {/* livraison */}
        <div className="st-card">
          <h2 className="flex items-center gap-2 font-sans text-[14px] font-bold">
            <MapPin className="h-4 w-4 text-st-gold" /> Livraison
          </h2>
          <div className="mt-3 text-[13px] text-[var(--st-warm-gray)]">
            <p>12 Rue de la Paix</p>
            <p>75002 Paris</p>
          </div>
        </div>
      </div>

      {/* articles */}
      <div className="st-card">
        <h2 className="flex items-center gap-2 font-sans text-[14px] font-bold">
          <Package className="h-4 w-4 text-st-gold" /> Articles
        </h2>
        <div className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between"><span>Kit Pad Thaï x2</span><span className="font-semibold">50,00 €</span></div>
          <div className="flex justify-between"><span>Sauce Satay x1</span><span className="font-semibold">12,00 €</span></div>
          <div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-bold">
            <span>Total</span><span className="text-st-gold">62,00 €</span>
          </div>
        </div>
      </div>

      <button className="st-btn-primary py-3.5 px-10">Enregistrer le statut</button>
    </div>
  );
}
