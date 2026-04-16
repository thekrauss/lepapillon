"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CtaBannerSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="st-section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-st-charcoal via-[#292524] to-[#1C1917] px-8 py-16 text-center sm:px-16 lg:py-20"
        >
          {/* decorative elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-st-gold/[0.08] blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-[300px] w-[300px] rounded-full bg-st-gold/[0.05] blur-[80px]" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-st-gold/20 bg-st-gold/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-st-gold">
              Offre de lancement
            </span>

            <h2 className="mx-auto mt-6 max-w-xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              -10% sur votre première commande
            </h2>

            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
              Utilisez le code{" "}
              <span className="rounded bg-st-gold/15 px-2 py-0.5 font-mono text-sm font-bold text-st-gold">
                SAWADEE10
              </span>{" "}
              à la commande. Valable sur tous les kits et prestations.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/boutique"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-st-gold px-7 py-3.5 text-[13px] font-semibold text-white transition-all hover:bg-st-gold-hover hover:shadow-lg hover:shadow-st-gold/25"
              >
                Commencer mes achats
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
