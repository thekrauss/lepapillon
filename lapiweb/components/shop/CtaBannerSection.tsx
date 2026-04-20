"use client";

import Link from "next/link";
import { ArrowRight, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const PROMO_CODE = "SAWADEE10";

export default function CtaBannerSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMO_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="st-section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-st-charcoal via-[#292524] to-[#1C1917] px-8 py-16 text-center sm:px-16 lg:py-24"
        >
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full bg-st-gold/[0.09] blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-[380px] w-[380px] rounded-full bg-st-gold/[0.06] blur-[90px]" />

          {/* grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px)",
            }}
          />

          <div className="relative z-10">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-st-gold/25 bg-st-gold/12 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-st-gold"
            >
              Offre de lancement
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mx-auto mt-6 max-w-2xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              −10% sur votre
              <span className="text-st-gold"> première commande</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/50"
            >
              Valable sur tous les kits et prestations. Cliquez sur le code pour le copier.
            </motion.p>

            {/* Promo code — click to copy */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex justify-center"
            >
              <button
                onClick={handleCopy}
                className="group flex items-center gap-3 rounded-2xl border border-st-gold/25 bg-st-gold/10 px-6 py-4 transition-all hover:border-st-gold/50 hover:bg-st-gold/15 animate-glow-ring"
              >
                <span className="font-mono text-xl font-bold tracking-[0.2em] text-st-gold">
                  {PROMO_CODE}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-st-gold/15 text-st-gold transition-all group-hover:bg-st-gold group-hover:text-white">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </span>
              </button>
            </motion.div>

            {copied && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm font-medium text-st-gold"
              >
                Code copié dans le presse-papiers !
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                href="/boutique"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-st-gold px-8 py-4 text-[13px] font-semibold text-white transition-all hover:bg-st-gold-hover hover:shadow-xl hover:shadow-st-gold/30 hover:-translate-y-0.5"
              >
                Commencer mes achats
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/prestation-chef"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-8 py-4 text-[13px] font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
              >
                Réserver une cheffe
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
