"use client";

import { ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: ShoppingBag,
    title: "Choisissez",
    description:
      "Parcourez nos kits de cuisine et ingrédients sélectionnés avec soin directement en Thaïlande.",
    color: "bg-st-gold/10 text-st-gold",
  },
  {
    icon: Truck,
    title: "Recevez",
    description:
      "Livraison rapide à Paris et en Île-de-France sous 24h. Paiement 100% sécurisé.",
    color: "bg-st-forest/10 text-st-forest",
  },  
  {
    icon: UtensilsCrossed,
    title: "Savourez",
    description:
      "Préparez vous-même grâce à nos recettes ou laissez notre cheffe cuisiner pour vous.",
    color: "bg-st-navy/10 text-st-navy",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function HowItWorksSection() {
  return (
    <section className="relative py-24 lg:py-32" id="engagements">
      <div className="st-section">
        <div className="text-center">
          <span className="st-kicker">Simple et rapide</span>
          <h2 className="st-heading mt-3">Comment ça marche</h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--st-warm-gray)]">
            De la sélection à la dégustation, nous vous accompagnons à chaque
            étape pour une expérience sans effort.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-6 sm:grid-cols-3"
        >
          {steps.map((step, i) => (
            <motion.div key={step.title} variants={item} className="group relative">
              <div className="st-card flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                {/* step number watermark */}
                <span className="absolute right-5 top-4 font-serif text-5xl font-bold text-[var(--foreground)]/[0.03]">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.color} transition-transform duration-300 group-hover:scale-110`}>
                  <step.icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 font-sans text-lg font-bold tracking-tight text-[var(--foreground)]">
                  {step.title}
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-[var(--st-warm-gray)]">
                  {step.description}
                </p>
              </div>

              {/* connector line between cards on desktop */}
              {i < steps.length - 1 && (
                <div className="pointer-events-none absolute right-0 top-1/2 hidden h-px w-6 -translate-y-1/2 translate-x-full bg-gradient-to-r from-[var(--border)] to-transparent sm:block" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
