// "use client";

// import { Star, Quote } from "lucide-react";
// import { motion } from "framer-motion";

// const testimonials = [
//   {
//     name: "Marie D.",
//     role: "Prestation anniversaire",
//     text: "Une expérience incroyable ! La cheffe a préparé un Pad Thaï exceptionnel devant nos yeux. Mes invités parlent encore de cette soirée.",
//     rating: 5,
//     avatar: "M",
//   },
//   {
//     name: "Thomas L.",
//     role: "Client régulier",
//     text: "Les kits sont parfaits pour les soirs de semaine. Ingrédients ultra-frais, recettes claires et résultat bluffant. On se croirait au marché de Bangkok !",
//     rating: 5,
//     avatar: "T",
//   },
//   {
//     name: "Sophie M.",
//     role: "Prestation entreprise",
//     text: "Nous avons fait appel à Saveurs Thaï pour un team building culinaire. Organisation impeccable, plats délicieux, équipe ravie. On recommande à 100%.",
//     rating: 5,
//     avatar: "S",
//   },
// ];

// const container = {
//   hidden: {},
//   show: { transition: { staggerChildren: 0.12 } },
// } as const;

// const item = {
//   hidden: { opacity: 0, y: 24 },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.5, ease: "easeOut" as const },
//   },
// };

// export default function TestimonialsSection() {
//   return (
//     <section className="relative overflow-hidden py-24 lg:py-32">
//       <div className="absolute inset-0 bg-gradient-to-b from-[var(--st-cream)] via-[#F5F0EB]/30 to-[var(--st-cream)]" />

//       <div className="st-section relative z-10">
//         <div className="text-center">
//           <span className="st-kicker">Avis vérifiés</span>
//           <h2 className="st-heading mt-3">Ce qu&apos;ils en pensent</h2>
//           <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[var(--st-warm-gray)]">
//             Plus de 120 clients satisfaits à Paris et en Île-de-France.
//           </p>
//         </div>

//         <motion.div
//           variants={container}
//           initial="hidden"
//           whileInView="show"
//           viewport={{ once: true, margin: "-60px" }}
//           className="mt-14 grid gap-5 sm:grid-cols-3"
//         >
//           {testimonials.map((t) => (
//             <motion.div key={t.name} variants={item}>
//               <div className="group relative flex h-full flex-col rounded-2xl border border-[var(--border)] bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-st-gold/15 hover:shadow-lg">
//                 {/* quote icon */}
//                 <Quote className="absolute right-5 top-5 h-8 w-8 text-[var(--foreground)]/[0.03]" />

//                 {/* stars */}
//                 <div className="flex gap-0.5">
//                   {Array.from({ length: t.rating }).map((_, i) => (
//                     <Star
//                       key={i}
//                       className="h-4 w-4 fill-st-gold text-st-gold"
//                     />
//                   ))}
//                 </div>

//                 {/* body */}
//                 <p className="mt-4 flex-1 text-[13px] leading-[1.8] text-[var(--st-warm-gray)]">
//                   &ldquo;{t.text}&rdquo;
//                 </p>

//                 {/* author */}
//                 <div className="mt-5 flex items-center gap-3 border-t border-[var(--border)] pt-4">
//                   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-st-gold/10 text-sm font-bold text-st-gold">
//                     {t.avatar}
//                   </div>
//                   <div>
//                     <p className="text-[13px] font-semibold text-[var(--foreground)]">
//                       {t.name}
//                     </p>
//                     <p className="text-[11px] text-[var(--st-warm-gray)]">
//                       {t.role}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </motion.div>
//       </div>
//     </section>
//   );
// }

"use client";

import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import ImageParallax from "@/components/ImageParallax"; // On importe le parallax

const testimonials = [
  {
    name: "Marie D.",
    role: "Prestation anniversaire",
    text: "Une expérience incroyable ! La cheffe a préparé un Pad Thaï exceptionnel devant nos yeux. Mes invités parlent encore de cette soirée.",
    rating: 5,
    avatar: "M",
  },
  {
    name: "Thomas L.",
    role: "Client régulier",
    text: "Les kits sont parfaits pour les soirs de semaine. Ingrédients ultra-frais, recettes claires et résultat bluffant. On se croirait au marché de Bangkok !",
    rating: 5,
    avatar: "T",
  },
  {
    name: "Sophie M.",
    role: "Prestation entreprise",
    text: "Nous avons fait appel à Saveurs Thaï pour un team building culinaire. Organisation impeccable, plats délicieux, équipe ravie. On recommande à 100%.",
    rating: 5,
    avatar: "S",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      
      {/* ── BACKGROUND AVEC EFFET PARALLAX ──────────────── */}
      <div className="absolute inset-0 z-0">
        <ImageParallax 
          src="/images/testi.jpg" // Une belle image de tablée ou d'ambiance
          alt="Ambiance cuisine thaï"
          className="absolute inset-0 h-full w-full"
        />
        {/* Overlay pour la lisibilité : on reste sur un crème très doux */}
        <div className="absolute inset-0 bg-st-cream/20 backdrop-blur-[1px]" />
      </div>

      <div className="st-section relative z-10">
        
        {/* ── EN-TÊTE AVEC EFFET GLASSMORPHISM (BLUR) ── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center rounded-2xl bg-white/20 p-8 backdrop-blur-md border border-white/20 shadow-sm"
        >
          <span className="st-kicker">Avis vérifiés</span>
          <h2 className="st-heading mt-3">Ce qu&apos;ils en pensent</h2>
          <p className="mx-auto mt-4 max-w-md text-[14px] font-medium leading-relaxed text-[var(--st-charcoal)]">
            Plus de 120 clients satisfaits à Paris et en Île-de-France.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-5 sm:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={item}>
              {/* Carte avec effet de transparence (glassmorphism) */}
              <div className="group relative flex h-full flex-col rounded-2xl border border-white/40 bg-white/70 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-st-gold/30 hover:bg-white/90 hover:shadow-xl">
                
                {/* quote icon */}
                <Quote className="absolute right-5 top-5 h-8 w-8 text-st-gold/[0.08]" />

                {/* stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-st-gold text-st-gold"
                    />
                  ))}
                </div>

                {/* body */}
                <p className="mt-4 flex-1 text-[13px] font-medium leading-[1.8] text-[var(--st-charcoal)]">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* author */}
                <div className="mt-5 flex items-center gap-3 border-t border-st-gold/10 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-st-gold text-sm font-bold text-white shadow-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[var(--st-charcoal)]">
                      {t.name}
                    </p>
                    <p className="text-[11px] font-medium text-[var(--st-warm-gray)]">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}