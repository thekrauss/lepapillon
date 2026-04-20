"use client";

import { ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    icon: ShoppingBag,
    title: "Choisissez",
    description:
      "Parcourez nos kits et ingrédients sélectionnés avec soin directement en Thaïlande.",
    color: "bg-st-gold/12 text-st-gold",
    iconBg: "bg-st-gold",
    accent: "from-amber-50 to-orange-50",
  },
  {
    icon: Truck,
    title: "Recevez",
    description:
      "Livraison rapide à Paris et en Île-de-France sous 24h. Paiement 100% sécurisé.",
    color: "bg-st-forest/10 text-st-forest",
    iconBg: "bg-st-forest",
    accent: "from-emerald-50 to-green-50",
  },
  {
    icon: UtensilsCrossed,
    title: "Savourez",
    description:
      "Préparez vous-même grâce à nos recettes ou laissez notre cheffe cuisiner pour vous.",
    color: "bg-st-navy/10 text-st-navy",
    iconBg: "bg-st-navy",
    accent: "from-blue-50 to-indigo-50",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden" id="engagements">
      {/* diagonal background accent */}
      <div className="pointer-events-none absolute inset-0 -skew-y-2 scale-105 bg-gradient-to-br from-[#FFF7ED]/60 via-[var(--st-cream)] to-[#F5F0EB]/40" />

      <div className="st-section relative z-10" ref={ref}>
        <div className="text-center">
          <span className="st-kicker">Simple et rapide</span>
          <h2 className="st-heading mt-3">Comment ça marche</h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--st-warm-gray)]">
            De la sélection à la dégustation, nous vous accompagnons à chaque
            étape pour une expérience sans effort.
          </p>
        </div>

        {/* ── progress line (desktop) ─────────────────────── */}
        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] top-10 hidden h-px sm:block">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ delay: 0.4, duration: 0.9, ease: "easeInOut" }}
              className="h-full origin-left bg-gradient-to-r from-st-gold/40 via-st-gold/20 to-st-gold/40"
            />
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="grid gap-6 sm:grid-cols-3"
          >
            {steps.map((step, i) => (
              <motion.div key={step.title} variants={item} className="group relative">
                <div className={`relative flex flex-col items-center overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br ${step.accent} p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl`}>
                  {/* giant number watermark */}
                  <span className="pointer-events-none absolute right-3 top-1 font-serif text-[6rem] font-bold leading-none text-[var(--foreground)]/[0.045] select-none">
                    {i + 1}
                  </span>

                  {/* icon circle */}
                  <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl ${step.iconBg} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="relative z-10 mt-6 font-serif text-xl font-bold tracking-tight text-[var(--foreground)]">
                    {step.title}
                  </h3>

                  <p className="relative z-10 mt-2.5 text-[13.5px] leading-relaxed text-[var(--st-warm-gray)]">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
