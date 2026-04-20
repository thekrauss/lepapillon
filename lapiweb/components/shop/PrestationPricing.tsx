"use client";

import { useState } from "react";
import { usePrestationPricing } from "@/hooks/usePrestation";
import { Loader2, Minus, Plus, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PrestationPricing() {
  const { data: pricing, isLoading } = usePrestationPricing();
  const [guests, setGuests] = useState(4);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-st-gold" />
      </div>
    );
  }
  if (!pricing) return null;

  const min = pricing.min_guests;
  const max = pricing.max_guests;
  const total = pricing.base_price + pricing.price_per_person * guests;
  const perPerson = Math.round(total / guests);

  const presets = [
    { n: min, label: `${min} pers.` },
    { n: 4, label: "4 pers." },
    { n: 6, label: "6 pers." },
    { n: max, label: `${max} pers.` },
  ].filter((p, i, arr) => p.n >= min && p.n <= max && arr.findIndex((a) => a.n === p.n) === i);

  return (
    <div className="mx-auto mt-12 max-w-2xl">
      {/* Main pricing card */}
      <div className="relative overflow-hidden rounded-3xl border border-st-gold/20 bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#1C1917] p-8 text-white shadow-2xl shadow-st-gold/10 sm:p-10">
        {/* glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-st-gold/[0.12] blur-[80px]" />

        <div className="relative z-10">
          {/* header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-st-gold">
                Prestation complète
              </p>
              <h3 className="mt-1 font-serif text-3xl font-bold sm:text-4xl">
                {fmt(total)}
              </h3>
              <p className="mt-1 text-[13px] text-white/50">
                soit {fmt(perPerson)} / personne · tout inclus
              </p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-st-gold/15">
              <Users className="h-8 w-8 text-st-gold" />
            </div>
          </div>

          {/* guest stepper */}
          <div className="mt-8">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/50">
              Nombre de convives
            </p>

            {/* presets */}
            <div className="mb-4 flex gap-2">
              {presets.map((p) => (
                <button
                  key={p.n}
                  onClick={() => setGuests(p.n)}
                  className={`flex-1 rounded-xl py-2 text-[12px] font-bold transition-all ${
                    guests === p.n
                      ? "bg-st-gold text-white shadow-lg shadow-st-gold/30"
                      : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* +/- stepper */}
            <div className="flex items-center justify-between rounded-2xl bg-white/8 px-5 py-4">
              <button
                onClick={() => setGuests((g) => Math.max(min, g - 1))}
                disabled={guests <= min}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="text-center">
                <p className="font-serif text-4xl font-bold leading-none text-white">
                  {guests}
                </p>
                <p className="mt-1 text-[11px] text-white/40">convives</p>
              </div>

              <button
                onClick={() => setGuests((g) => Math.min(max, g + 1))}
                disabled={guests >= max}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* price breakdown */}
          <div className="mt-6 space-y-2 rounded-2xl bg-white/5 p-4 text-[13px]">
            <div className="flex justify-between text-white/60">
              <span>Forfait base</span>
              <span>{fmt(pricing.base_price)}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>
                {guests} × {fmt(pricing.price_per_person)} / personne
              </span>
              <span>{fmt(pricing.price_per_person * guests)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-white">
              <span>Total</span>
              <span className="text-st-gold">{fmt(total)}</span>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/panier/prestation"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-st-gold py-4 text-[13px] font-semibold text-white transition-all hover:bg-st-gold-hover hover:shadow-xl hover:shadow-st-gold/30"
          >
            Réserver pour {guests} personnes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* reassurance line */}
      <p className="mt-5 text-center text-[12px] text-[var(--st-warm-gray)]">
        Aucune surprise — courses, déplacement et service compris · Annulation gratuite 48h avant
      </p>
    </div>
  );
}
