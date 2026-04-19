// "use client";

// import Link from "next/link";
// import { ShoppingBag, ArrowRight, UtensilsCrossed, Flame } from "lucide-react";
// import { motion } from "framer-motion";

// const featuredProducts = [
//   {
//     name: "Kit Pad Thaï",
//     price: "25,00",
//     tag: "Best-seller",
//     tagColor: "bg-st-gold/10 text-st-gold-hover",
//     description:
//       "Nouilles de riz, sauce tamarin, cacahuètes, crevettes séchées. Pour 2 personnes.",
//     gradient: "from-amber-50 to-orange-50",
//   },
//   {
//     name: "Curry Massaman",
//     price: "18,00",
//     tag: "Nouveau",
//     tagColor: "bg-st-forest/10 text-st-forest",
//     description:
//       "Pâte de curry maison, lait de coco, pommes de terre, cacahuètes. Doux et parfumé.",
//     gradient: "from-green-50 to-emerald-50",
//   },
//   {
//     name: "Sauce Satay",
//     price: "12,00",
//     tag: "Populaire",
//     tagColor: "bg-st-navy/10 text-st-navy",
//     description:
//       "Beurre de cacahuète, citronnelle, galanga, piment doux. Prête à l'emploi.",
//     gradient: "from-blue-50 to-indigo-50",
//   },
//   {
//     name: "Tom Yum",
//     price: "22,00",
//     tag: "Épicé",
//     tagColor: "bg-red-50 text-red-600",
//     description:
//       "Bouillon aux crevettes, galanga, feuilles de kaffir, champignons. Intense.",
//     gradient: "from-red-50 to-orange-50",
//   },
// ];

// const container = {
//   hidden: {},
//   show: { transition: { staggerChildren: 0.1 } },
// } as const;

// const item = {
//   hidden: { opacity: 0, y: 28 },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.5, ease: "easeOut" as const },
//   },
// };

// export default function FeaturedProductsSection() {
//   return (
//     <section className="relative py-24 lg:py-32 overflow-hidden">
//       {/* subtle bg */}
//       <div className="absolute inset-0 bg-gradient-to-b from-[var(--st-cream)] via-[#F5F0EB]/40 to-[var(--st-cream)]" />

//       <div className="st-section relative z-10">
//         {/* ── section header ────────────────────────────── */}
//         <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
//           <div>
//             <span className="st-kicker">Sélection du moment</span>
//             <h2 className="st-heading mt-3">Nos produits phares</h2>
//             <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--st-warm-gray)]">
//               Des kits complets pour reproduire les classiques de la cuisine
//               thaïlandaise chez vous.
//             </p>
//           </div>
//           <Link
//             href="/boutique"
//             className="group hidden items-center gap-1.5 rounded-full border border-[var(--border)] px-5 py-2.5 text-[13px] font-semibold text-[var(--foreground)] transition-all hover:border-st-gold/30 hover:text-st-gold sm:flex"
//           >
//             Tout le catalogue
//             <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
//           </Link>
//         </div>

//         {/* ── product grid ──────────────────────────────── */}
//         <motion.div
//           variants={container}
//           initial="hidden"
//           whileInView="show"
//           viewport={{ once: true, margin: "-60px" }}
//           className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
//         >
//           {featuredProducts.map((product) => (
//             <motion.div key={product.name} variants={item}>
//               <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-card transition-all duration-300 hover:-translate-y-1 hover:border-st-gold/20 hover:shadow-xl hover:shadow-st-gold/[0.06]">
//                 {/* image area */}
//                 <div className={`relative flex h-52 items-center justify-center bg-gradient-to-br ${product.gradient}`}>
//                   <UtensilsCrossed className="h-10 w-10 text-[var(--foreground)]/[0.06] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
//                   {/* tag */}
//                   <span className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${product.tagColor}`}>
//                     {product.tag === "Épicé" && <Flame className="h-3 w-3" />}
//                     {product.tag}
//                   </span>
//                 </div>

//                 {/* content */}
//                 <div className="flex flex-1 flex-col p-5">
//                   <h3 className="font-sans text-[15px] font-bold tracking-tight text-[var(--foreground)]">
//                     {product.name}
//                   </h3>
//                   <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-[var(--st-warm-gray)]">
//                     {product.description}
//                   </p>
//                   <div className="mt-4 flex items-center justify-between">
//                     <p className="text-xl font-bold text-[var(--foreground)]">
//                       {product.price}
//                       <span className="ml-0.5 text-xs font-normal text-[var(--st-warm-gray)]">
//                         €
//                       </span>
//                     </p>
//                     <button className="flex h-10 w-10 items-center justify-center rounded-full bg-st-gold text-white transition-all hover:bg-st-gold-hover hover:shadow-md hover:shadow-st-gold/25 active:scale-95">
//                       <ShoppingBag className="h-4 w-4" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </motion.div>

//         {/* mobile CTA */}
//         <div className="mt-10 text-center sm:hidden">
//           <Link href="/boutique" className="st-btn-secondary inline-flex items-center gap-1.5 text-[13px]">
//             Tout le catalogue <ArrowRight className="h-3.5 w-3.5" />
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// }



"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, UtensilsCrossed, Flame } from "lucide-react";
import { motion } from "framer-motion";
import ImageParallax from "@/components/ImageParallax"; // On importe ton composant parallax

const featuredProducts = [
  {
    name: "Kit Pad Thaï",
    price: "25,00",
    tag: "Best-seller",
    tagColor: "bg-st-gold/10 text-st-gold-hover",
    description:
      "Nouilles de riz, sauce tamarin, cacahuètes, crevettes séchées. Pour 2 personnes.",
    gradient: "from-amber-50 to-orange-50",
  },
  {
    name: "Curry Massaman",
    price: "18,00",
    tag: "Nouveau",
    tagColor: "bg-st-forest/10 text-st-forest",
    description:
      "Pâte de curry maison, lait de coco, pommes de terre, cacahuètes. Doux et parfumé.",
    gradient: "from-green-50 to-emerald-50",
  },
  {
    name: "Sauce Satay",
    price: "12,00",
    tag: "Populaire",
    tagColor: "bg-st-navy/10 text-st-navy",
    description:
      "Beurre de cacahuète, citronnelle, galanga, piment doux. Prête à l'emploi.",
    gradient: "from-blue-50 to-indigo-50",
  },
  {
    name: "Tom Yum",
    price: "22,00",
    tag: "Épicé",
    tagColor: "bg-red-50 text-red-600",
    description:
      "Bouillon aux crevettes, galanga, feuilles de kaffir, champignons. Intense.",
    gradient: "from-red-50 to-orange-50",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function FeaturedProductsSection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      
      {/* ── BACKGROUND AVEC EFFET PARALLAX ──────────────── */}
      <div className="absolute inset-0 z-0">
        <ImageParallax 
          src="/images/feature2.jpg" 
          alt="Ingrédients thaïlandais"
          className="absolute inset-0 h-full w-full"
        />
        {/* Overlay pour la lisibilité : on utilise un crème très opaque pour faire ressortir les cartes */}
        <div className="absolute inset-0 bg-st-cream/20 backdrop-blur-[2px]" />
      </div>

      <div className="st-section relative z-10">
        {/* ── section header ────────────────────────────── */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="st-kicker">Sélection du moment</span>
            <h2 className="st-heading mt-3">Nos produits phares</h2>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--st-warm-gray)]">
              Des kits complets pour reproduire les classiques de la cuisine
              thaïlandaise chez vous.
            </p>
          </motion.div>
          
          <Link
            href="/boutique"
            className="group hidden items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/50 backdrop-blur-sm px-5 py-2.5 text-[13px] font-semibold text-[var(--foreground)] transition-all hover:border-st-gold/30 hover:text-st-gold sm:flex"
          >
            Tout le catalogue
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* ── product grid ──────────────────────────────── */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {featuredProducts.map((product) => (
            <motion.div key={product.name} variants={item}>
              <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-st-gold/20 hover:shadow-xl hover:shadow-st-gold/[0.06]">
                {/* image area */}
                <div className={`relative flex h-52 items-center justify-center bg-gradient-to-br ${product.gradient}`}>
                  <UtensilsCrossed className="h-10 w-10 text-[var(--foreground)]/[0.06] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
                  {/* tag */}
                  <span className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${product.tagColor}`}>
                    {product.tag === "Épicé" && <Flame className="h-3 w-3" />}
                    {product.tag}
                  </span>
                </div>

                {/* content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-sans text-[15px] font-bold tracking-tight text-[var(--foreground)]">
                    {product.name}
                  </h3>
                  <p className="mt-1.5 flex-1 text-[12px] font-medium leading-relaxed text-[var(--st-warm-gray)]">
                    {product.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xl font-bold text-[var(--foreground)]">
                      {product.price}
                      <span className="ml-0.5 text-xs font-normal text-[var(--st-warm-gray)]">
                        €
                      </span>
                    </p>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-st-gold text-white transition-all hover:bg-st-gold-hover hover:shadow-md hover:shadow-st-gold/25 active:scale-95">
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* mobile CTA */}
        <div className="mt-10 text-center sm:hidden">
          <Link href="/boutique" className="st-btn-secondary inline-flex items-center gap-1.5 bg-white/50 backdrop-blur-sm text-[13px]">
            Tout le catalogue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}