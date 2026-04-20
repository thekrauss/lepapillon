"use client";

import Link from "next/link";
import { ShoppingBag, ChefHat, ArrowDown, Star, Clock, Flame } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ── CountUp helper ──────────────────────────────────────────
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ── Variants ─────────────────────────────────────────────────
const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

// ── Mini product cards for the mosaic ───────────────────────
const mosaicCards = [
  {
    name: "Kit Pad Thaï",
    price: "25,00 €",
    tag: "Best-seller",
    tagColor: "bg-st-gold/15 text-st-gold-hover",
    gradient: "from-amber-50 via-orange-50 to-amber-100",
    icon: Flame,
    rotate: "rotate-[1.5deg]",
    delay: 0.35,
    size: "large",
  },
  {
    name: "Tom Yum",
    price: "22,00 €",
    tag: "Épicé",
    tagColor: "bg-red-50 text-red-600",
    gradient: "from-red-50 via-orange-50 to-red-100",
    icon: ShoppingBag,
    rotate: "-rotate-[2deg]",
    delay: 0.5,
    size: "small",
  },
  {
    name: "Curry Massaman",
    price: "18,00 €",
    tag: "Nouveau",
    tagColor: "bg-st-forest/10 text-st-forest",
    gradient: "from-emerald-50 via-green-50 to-teal-50",
    icon: ShoppingBag,
    rotate: "rotate-[1deg]",
    delay: 0.65,
    size: "small",
  },
];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden">
      {/* ── background layers ────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--st-cream)] via-[#FFF7ED] to-[var(--st-cream)]" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full bg-st-gold/[0.06] blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-st-forest/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-st-navy/[0.03] blur-[100px]" />

      {/* ── grain overlay ─────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />

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
                <span className="absolute -bottom-1 left-0 right-0 h-3 rounded-sm bg-st-gold/10" />
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

            {/* ── stat counters ──────────────────────────── */}
            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-12 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-8"
            >
              {[
                { value: 250, suffix: "+", label: "Prestations réalisées" },
                { value: 120, suffix: "+", label: "Clients satisfaits" },
                { value: 49, suffix: "/5", label: "Note moyenne", divisor: 10 },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="font-serif text-[1.75rem] font-bold leading-none text-st-charcoal">
                    {stat.divisor ? (
                      <CountSplit target={stat.value} divisor={stat.divisor} />
                    ) : (
                      <CountUp target={stat.value} suffix={stat.suffix} />
                    )}
                  </span>
                  <span className="mt-1 text-[11px] leading-tight text-st-warm-gray/70">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── visual mosaic column ─────────────────────── */}
          <div className="relative hidden h-[520px] lg:block">
            {/* Main large card */}
            <motion.div
              initial={{ opacity: 0, y: 32, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: 1.5 }}
              transition={{ delay: 0.35, duration: 0.8, ease: "easeOut" }}
              className="animate-float absolute right-0 top-0 w-72 overflow-hidden rounded-[1.75rem] border border-st-gold/10 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-2xl shadow-st-gold/10"
              style={{ "--float-rotate": "1.5deg" } as React.CSSProperties}
            >
              <div className="p-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-st-gold/15 px-2.5 py-1 text-[10px] font-bold text-st-gold-hover">
                  <Flame className="h-3 w-3" /> Best-seller
                </span>
                <div className="mt-4 overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&q=80"
                    alt="Kit Pad Thaï"
                    className="h-32 w-full object-cover"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="font-serif text-lg font-bold text-st-charcoal">Kit Pad Thaï</h3>
                  <p className="mt-0.5 text-xs text-st-warm-gray">Nouilles de riz, sauce tamarin, pour 2 pers.</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-serif text-2xl font-bold text-st-charcoal">
                      28 <span className="text-sm">€</span>
                    </span>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-st-gold text-white shadow-lg shadow-st-gold/30 transition-transform hover:scale-110">
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Secondary card — bottom-left */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.7, ease: "easeOut" }}
              className="animate-float absolute bottom-12 left-0 w-52 overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 shadow-xl shadow-red-500/8"
              style={{ "--float-rotate": "-2deg", animationDelay: "1.2s" } as React.CSSProperties}
            >
              <div className="p-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  <Flame className="h-2.5 w-2.5" /> Épicé
                </span>
                <h4 className="mt-2 font-serif text-[15px] font-bold text-st-charcoal">Tom Yum</h4>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-st-charcoal">22 €</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-st-gold text-st-gold" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Availability floating card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
              className="absolute bottom-24 right-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-st-gold/10">
                  <Clock className="h-5 w-5 text-st-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold text-st-charcoal">Prochaine disponibilité</p>
                  <p className="text-[11px] text-st-warm-gray">Samedi 19 avril · 2 places</p>
                </div>
              </div>
            </motion.div>

            {/* Rating badge — top-left */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute -left-4 top-12 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-lg"
            >
              <p className="font-serif text-2xl font-bold text-st-gold">4.9</p>
              <div className="mt-0.5 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-st-gold text-st-gold" />
                ))}
              </div>
              <p className="mt-1 text-[10px] font-medium text-st-warm-gray">120+ avis clients</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
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

// Affiche "4.9" depuis target=49 divisor=10
function CountSplit({ target, divisor }: { target: number; divisor: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  const whole = Math.floor(count / divisor);
  const decimal = count % divisor;
  return (
    <span ref={ref}>
      {whole}.{decimal}
    </span>
  );
}
