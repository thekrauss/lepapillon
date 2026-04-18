"use client";

import Link from "next/link";
import { ShoppingBag, ChefHat, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import ImageParallax from "@/components/ImageParallax";

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
      
      {/* ── BACKGROUND IMAGE PARALLAX ──────────────── */}
      <div className="absolute inset-0 z-0">
        <ImageParallax 
          src="/images/hero1.jpg" 
          alt="Cheffe Thaï en action"
          className="absolute inset-0 h-full w-full" 
        />
        
        {/* Overlay intelligent */}
        <div className="absolute inset-0 bg-st-cream/10 lg:bg-gradient-to-r lg:from-st-cream lg:via-st-cream/10 lg:to-transparent" />
      </div>

      {/* ── background layers ── */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full bg-st-gold/[0.15] blur-[140px] z-0" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-st-forest/[0.1] blur-[120px] z-0" />
      
      {/* ── decorative grain overlay ─────────────────────── */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] z-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat" }} />

      {/* ── CONTENU PRINCIPAL ────────────────────────────── */}
      <div className="st-section relative z-10 py-32 lg:py-40 w-full">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          
          {/* ── text column ──────────────────────────────── */}
          <div>
            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-st-gold/20 bg-white/80 px-4 py-1.5 backdrop-blur-sm shadow-sm"
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
              La Thailande{" "}
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
              className="mt-6 max-w-lg text-base leading-relaxed text-st-warm-gray sm:text-lg font-medium"
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
              <Link href="/prestation-chef" className="st-btn-secondary bg-white/50 backdrop-blur-sm gap-2 py-3.5 text-[13px]">
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
              className="mt-12 flex items-center gap-6 text-xs text-st-warm-gray/90 font-medium"
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

          {/* ── visual column (Cartes flottantes) ────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="relative hidden lg:block h-[500px]"
          >
            {/* floating badge top-right */}
            <div className="absolute right-0 top-10 rounded-2xl border border-white/60 bg-white/90 px-5 py-4 shadow-xl backdrop-blur-md">
              <p className="text-3xl font-bold text-st-gold">4.9</p>
              <div className="flex text-st-gold mt-1">
                {'★★★★★'.split('').map((star, i) => <span key={i} className="text-[10px]">{star}</span>)}
              </div>
              <p className="text-[11px] font-medium text-st-warm-gray mt-1">
                120+ avis clients
              </p>
            </div>

            {/* floating card bottom */}
            <div className="absolute bottom-10 left-10 rounded-2xl border border-white/60 bg-white/80 p-5 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-st-gold/10">
                  <ChefHat className="h-6 w-6 text-st-gold" />
                </div>
                <div>
                  <p className="text-sm font-bold text-st-charcoal">
                    Prochaine disponibilité
                  </p>
                  <p className="text-xs text-st-warm-gray mt-0.5">
                    Samedi 19 avril — 2 places
                  </p>
                </div>
              </div>
            </div>
            
          </motion.div>
        </div>
      </div>

      {/* ── SCROLL INDICATOR AVEC TAILWIND ──────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        {/* On utilise animate-bounce de Tailwind au lieu de Framer Motion */}
        <div className="animate-bounce">
          <ArrowDown className="h-6 w-6 text-st-charcoal/40" />
        </div>
      </motion.div>
    </section>
  );
}