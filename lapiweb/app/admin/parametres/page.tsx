"use client";

import { useState, useEffect } from "react";
import { Euro, Loader2 } from "lucide-react";
import { useAdminPrestationPricing, useUpdatePrestationPricing } from "@/hooks/useAdmin";

export default function AdminParametresPage() {
  const { data: pricing, isLoading } = useAdminPrestationPricing();
  const updatePricing = useUpdatePrestationPricing();

  const [basePrice, setBasePrice] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");

  useEffect(() => {
    if (pricing) {
      setBasePrice(String(pricing.base_price / 100));
      setPricePerPerson(String(pricing.price_per_person / 100));
      setMinGuests(String(pricing.min_guests));
      setMaxGuests(String(pricing.max_guests));
    }
  }, [pricing]);

  const handleSave = () => {
    updatePricing.mutate({
      base_price: Math.round(parseFloat(basePrice || "0") * 100),
      price_per_person: Math.round(parseFloat(pricePerPerson || "0") * 100),
      min_guests: parseInt(minGuests || "2", 10),
      max_guests: parseInt(maxGuests || "12", 10),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-bold">Parametres</h1>
        <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">Configuration des prestations.</p>
      </div>

      <div className="st-card space-y-5">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
          <Euro className="h-5 w-5 text-st-gold" /> Tarifs prestation
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Prix de base (EUR)</label>
            <input
              type="number"
              className="st-input w-full"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              min={0}
              step={0.01}
            />
            <p className="mt-1 text-[11px] text-[var(--st-warm-gray)]">Montant fixe de la prestation</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Prix par personne (EUR)</label>
            <input
              type="number"
              className="st-input w-full"
              value={pricePerPerson}
              onChange={(e) => setPricePerPerson(e.target.value)}
              min={0}
              step={0.01}
            />
            <p className="mt-1 text-[11px] text-[var(--st-warm-gray)]">Ajoute au prix de base par convive</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Convives minimum</label>
            <input
              type="number"
              className="st-input w-full"
              value={minGuests}
              onChange={(e) => setMinGuests(e.target.value)}
              min={1}
              max={20}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Convives maximum</label>
            <input
              type="number"
              className="st-input w-full"
              value={maxGuests}
              onChange={(e) => setMaxGuests(e.target.value)}
              min={1}
              max={50}
            />
          </div>
        </div>

        {pricing && (
          <div className="rounded-xl bg-[var(--muted)]/50 p-4">
            <p className="text-[12px] font-semibold text-[var(--st-warm-gray)]">Exemple de tarif</p>
            <p className="mt-1 text-[14px]">
              Pour {minGuests || 2} convives :{" "}
              <span className="font-bold text-st-gold">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                  parseFloat(basePrice || "0") + parseFloat(pricePerPerson || "0") * parseInt(minGuests || "2", 10)
                )}
              </span>
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={updatePricing.isPending}
        className="st-btn-primary gap-2 py-3.5 px-10 disabled:opacity-50"
      >
        {updatePricing.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</>
        ) : (
          "Enregistrer"
        )}
      </button>
    </div>
  );
}
