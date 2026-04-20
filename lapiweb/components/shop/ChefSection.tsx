"use client";

import Link from "next/link";
import {
  ChefHat,
  Clock,
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Star,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Clock, label: "3h de prestation", detail: "Entrée au dessert" },
  { icon: UtensilsCrossed, label: "Menu 5 plats", detail: "Sur mesure" },
  { icon: ShoppingBag, label: "Courses incluses", detail: "Produits frais" },
  { icon: Sparkles, label: "Décoration thaïe", detail: "Ambiance comprise" },
];

export default function ChefSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* background accent */}
      <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-st-navy/[0.03] blur-[140px]" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-st-gold/[0.04] blur-[120px]" />

      <div className="st-section relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* ── visual column ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border border-st-navy/8 shadow-2xl shadow-st-navy/[0.06]">
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
                alt="Cheffe thaïlandaise en cuisine"
                className="h-full w-full object-cover"
              />
            </div>

            {/* floating stats card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -bottom-4 -right-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-lg sm:-right-8"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-st-gold/10">
                  <Users className="h-5 w-5 text-st-gold" />
                </div>
                <div>
                  <p className="text-xl font-bold text-st-charcoal">250+</p>
                  <p className="text-[11px] text-st-warm-gray">Prestations réalisées</p>
                </div>
              </div>
            </motion.div>

            {/* floating rating card */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute -left-4 top-8 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-lg sm:-left-6"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-st-gold text-st-gold" />
                ))}
              </div>
              <p className="mt-1 text-[11px] font-medium text-st-warm-gray">
                Note moyenne clients
              </p>
            </motion.div>
          </motion.div>

          {/* ── content column ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="st-kicker">Expérience unique</span>
            <h2 className="st-heading mt-3">
              Votre cheffe thaïlandaise
              <br />
              <span className="text-st-navy">à domicile</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-[1.8] text-[var(--st-warm-gray)]">
              Offrez-vous un voyage culinaire sans quitter votre salon. Notre
              cheffe prépare un menu authentique devant vos yeux avec des
              ingrédients frais et des recettes familiales transmises depuis
              des générations.
            </p>

            {/* features grid */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-card p-3.5 transition-all hover:border-st-gold/20 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-st-gold/8 transition-colors group-hover:bg-st-gold/15">
                    <f.icon className="h-5 w-5 text-st-gold" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--foreground)]">
                      {f.label}
                    </p>
                    <p className="text-[11px] text-[var(--st-warm-gray)]">
                      {f.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/prestation-chef"
                className="st-btn-primary gap-2 px-7 py-3.5 text-[13px]"
              >
                Découvrir la prestation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-sm text-[var(--st-warm-gray)]">
                À partir de{" "}
                <span className="font-bold text-st-gold">80 €</span> / 2 pers.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
