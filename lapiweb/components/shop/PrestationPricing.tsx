"use client";

import { usePrestationPricing } from "@/hooks/usePrestation";
import { Loader2 } from "lucide-react";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PrestationPricing() {
  const { data: pricing, isLoading } = usePrestationPricing();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-st-gold" />
      </div>
    );
  }

  if (!pricing) return null;

  const examples = [
    { count: pricing.min_guests, label: `${pricing.min_guests} personnes` },
    { count: 4, label: "4 personnes" },
    { count: 6, label: "6 personnes" },
    { count: pricing.max_guests, label: `${pricing.max_guests} personnes` },
  ].filter((e, i, arr) => arr.findIndex((a) => a.count === e.count) === i && e.count >= pricing.min_guests && e.count <= pricing.max_guests);

  return (
    <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
      {examples.map((e) => {
        const total = pricing.base_price + pricing.price_per_person * e.count;
        return (
          <div key={e.count} className="st-card text-center transition-all hover:-translate-y-0.5 hover:border-st-gold/20 hover:shadow-md">
            <p className="text-[13px] font-bold text-[var(--st-warm-gray)]">{e.label}</p>
            <p className="mt-2 text-3xl font-bold text-st-gold">{fmt(total)}</p>
            <p className="mt-2 text-[12px] text-[var(--st-warm-gray)]">
              {fmt(pricing.base_price)} + {fmt(pricing.price_per_person)}/pers.
            </p>
          </div>
        );
      })}
    </div>
  );
}
