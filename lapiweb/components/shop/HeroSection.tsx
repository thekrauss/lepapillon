"use client";

import Link from "next/link";
import { ShoppingBag, ChefHat, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden">
      {/* ── background layers ────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--st-cream)] via-[#FFF7ED] to-[var(--st-cream)]" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full bg-st-gold/[0.06] blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-st-forest/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-st-navy/[0.03] blur-[100px]" />

      {/* ── decorative grain overlay ─────────────────────── */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat" }} />

      <div className="st-section relative z-10 py-32 lg:py-40">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* ── text column ──────────────────────────────── */}
          <div>
            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-st-gold/20 bg-white/60 px-4 py-1.5 backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-st-forest animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-st-charcoal/70">
                Livraison Paris &amp; IDF
              </span>
            </motion.div>

            <motion.h1
              variants={fade}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-6 text-[clamp(2.5rem,5vw,4.25rem)] font-bold leading-[1.08] tracking-tight"
            >
              La Thaïlande{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-st-gold">dans votre cuisine</span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-st-gold/10 rounded-sm" />
              </span>
            </motion.h1>

            <motion.p
              variants={fade}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-6 max-w-lg text-base leading-relaxed text-st-warm-gray sm:text-lg"
            >
              Kits de cuisine prêts à préparer, ingrédients artisanaux importés
              et prestation cheffe à domicile pour une expérience authentique
              inoubliable.
            </motion.p>

            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-10 flex flex-col gap-3.5 sm:flex-row sm:items-center"
            >
              <Link href="/boutique" className="st-btn-primary gap-2 px-7 py-3.5 text-[13px]">
                <ShoppingBag className="h-4 w-4" />
                Découvrir les kits
              </Link>
              <Link href="/prestation-chef" className="st-btn-secondary gap-2 py-3.5 text-[13px]">
                <ChefHat className="h-4 w-4" />
                Réserver une cheffe
              </Link>
            </motion.div>

            {/* trust signals */}
            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-12 flex items-center gap-6 text-xs text-st-warm-gray/80"
            >
              {["100% authentique", "Livraison 24h", "Paiement sécurisé"].map(
                (text) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-st-gold" />
                    {text}
                  </span>
                )
              )}
            </motion.div>
          </div>

          {/* ── visual column ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-st-gold/10 bg-gradient-to-br from-white via-[#FFF7ED] to-[#F5F0EB] shadow-2xl shadow-st-gold/8">
              {/* placeholder visual composition */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-10">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-st-gold/10">
                  <ChefHat className="h-14 w-14 text-st-gold/50" />
                </div>
                <p className="text-center text-sm font-medium text-st-warm-gray/60">
                  Photo hero : cheffe en action
                </p>
              </div>

              {/* floating card */}
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/60 bg-white/80 p-4 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-st-gold/10">
                    <ChefHat className="h-5 w-5 text-st-gold" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-st-charcoal">
                      Prochaine disponibilité
                    </p>
                    <p className="text-[11px] text-st-warm-gray">
                      Samedi 19 avril — 2 places restantes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* floating badge top-right */}
            <div className="absolute -right-4 top-8 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md">
              <p className="text-2xl font-bold text-st-gold">4.9</p>
              <p className="text-[10px] font-medium text-st-warm-gray">
                120+ avis
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ArrowDown className="h-5 w-5 text-st-warm-gray/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
