"use client";

import { Star, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Marie D.",
    role: "Prestation anniversaire",
    text: "Une expérience incroyable ! La cheffe a préparé un Pad Thaï exceptionnel devant nos yeux. Mes invités parlent encore de cette soirée.",
    rating: 5,
    avatar: "M",
    avatarBg: "bg-st-gold/15 text-st-gold",
  },
  {
    name: "Thomas L.",
    role: "Client régulier",
    text: "Les kits sont parfaits pour les soirs de semaine. Ingrédients ultra-frais, recettes claires et résultat bluffant. On se croirait au marché de Bangkok !",
    rating: 5,
    avatar: "T",
    avatarBg: "bg-st-forest/10 text-st-forest",
  },
  {
    name: "Sophie M.",
    role: "Prestation entreprise",
    text: "Nous avons fait appel à Saveurs Thaï pour un team building culinaire. Organisation impeccable, plats délicieux, équipe ravie. On recommande à 100%.",
    rating: 5,
    avatar: "S",
    avatarBg: "bg-st-navy/10 text-st-navy",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--st-cream)] via-[#F5F0EB]/30 to-[var(--st-cream)]" />

      {/* decorative large quote — desktop only */}
      <div
        className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 select-none font-serif text-[18rem] font-bold leading-none text-[var(--foreground)]/[0.025]"
        aria-hidden
      >
        &ldquo;
      </div>

      <div className="st-section relative z-10">
        <div className="text-center">
          <span className="st-kicker">Avis vérifiés</span>
          <h2 className="st-heading mt-3">Ce qu&apos;ils en pensent</h2>
          <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[var(--st-warm-gray)]">
            Plus de 120 clients satisfaits à Paris et en Île-de-France.
          </p>

          {/* aggregate rating */}
          <div className="mx-auto mt-5 inline-flex items-center gap-2.5 rounded-full border border-st-gold/20 bg-white/70 px-5 py-2 backdrop-blur-sm">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-st-gold text-st-gold" />
              ))}
            </div>
            <span className="text-sm font-bold text-st-charcoal">4.9</span>
            <span className="text-sm text-st-warm-gray">/ 5 · 120 avis</span>
          </div>
        </div>

        {/* ── cards : horizontal scroll on mobile, 3-col on desktop ── */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-12 flex gap-5 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] snap-x snap-mandatory"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={item}
              className="min-w-[82vw] snap-start sm:min-w-0"
            >
              <div className="group relative flex h-full flex-col rounded-2xl border border-[var(--border)] bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-st-gold/20 hover:shadow-xl hover:shadow-st-gold/[0.06]">
                {/* verified badge */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-st-gold text-st-gold" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-st-forest/8 px-2.5 py-1 text-[10px] font-semibold text-st-forest">
                    <BadgeCheck className="h-3 w-3" />
                    Vérifié
                  </div>
                </div>

                {/* text */}
                <p className="mt-5 flex-1 text-[14px] leading-[1.85] text-[var(--foreground)]/80">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* author */}
                <div className="mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${t.avatarBg}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--foreground)]">{t.name}</p>
                    <p className="text-[11px] text-[var(--st-warm-gray)]">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* mobile scroll dots */}
        <div className="mt-5 flex justify-center gap-1.5 sm:hidden">
          {testimonials.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-5 bg-st-gold" : "w-1.5 bg-[var(--border)]"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
