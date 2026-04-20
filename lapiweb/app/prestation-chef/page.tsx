"use client";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import PrestationPricing from "@/components/shop/PrestationPricing";
import Link from "next/link";
import {
  ChefHat, Clock, UtensilsCrossed, ShoppingBag, Sparkles, Users,
  MapPin, CalendarDays, Star, ArrowRight, Check, MessageCircle,
  Flame, Leaf, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// ── Data ────────────────────────────────────────────────────

const inclus = [
  { icon: UtensilsCrossed, label: "Menu 5 plats", detail: "Entrée, soupe, 2 plats, dessert", color: "bg-st-gold/12 text-st-gold" },
  { icon: ShoppingBag, label: "Courses incluses", detail: "Tous les ingrédients frais", color: "bg-emerald-50 text-st-forest" },
  { icon: Clock, label: "3h de prestation", detail: "Préparation et service", color: "bg-blue-50 text-st-navy" },
  { icon: Sparkles, label: "Décoration thaïe", detail: "Ambiance authentique", color: "bg-purple-50 text-purple-600" },
  { icon: MapPin, label: "À domicile", detail: "Paris et Île-de-France", color: "bg-red-50 text-red-500" },
  { icon: Users, label: "2 à 12 convives", detail: "Intimiste ou groupe", color: "bg-orange-50 text-orange-600" },
];

const timeline = [
  {
    step: "01",
    title: "Vous réservez en ligne",
    detail: "Choisissez votre créneau, indiquez votre adresse et vos préférences. Confirmation immédiate.",
    icon: CalendarDays,
    color: "bg-st-gold text-white",
  },
  {
    step: "02",
    title: "La cheffe prépare votre menu",
    detail: "Elle sélectionne les meilleurs ingrédients frais et adapte le menu à vos goûts et allergies.",
    icon: ChefHat,
    color: "bg-st-navy text-white",
  },
  {
    step: "03",
    title: "Elle arrive chez vous",
    detail: "Avec tout le matériel, les ingrédients et sa touche d'authenticité. Vous n'avez rien à préparer.",
    icon: Flame,
    color: "bg-st-forest text-white",
  },
  {
    step: "04",
    title: "Vous savourez",
    detail: "Un festin thaïlandais servi sur votre table. Elle s'occupe aussi de la vaisselle !",
    icon: Sparkles,
    color: "bg-purple-600 text-white",
  },
];

const menu = [
  { plat: "Entrée", nom: "Salade de papaye verte Som Tam", tag: "Végétarien", tagColor: "bg-green-100 text-green-700", icon: Leaf,
    img: "https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=120&q=80" },
  { plat: "Soupe", nom: "Tom Kha Gai — bouillon coco galanga", tag: "Signature", tagColor: "bg-st-gold/15 text-st-gold-hover", icon: Flame,
    img: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=120&q=80" },
  { plat: "Plat 1", nom: "Pad Thaï aux crevettes", tag: "Best-seller", tagColor: "bg-amber-100 text-amber-700", icon: UtensilsCrossed,
    img: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=120&q=80" },
  { plat: "Plat 2", nom: "Curry massaman ou green curry", tag: "Au choix", tagColor: "bg-blue-100 text-blue-700", icon: ChefHat,
    img: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=120&q=80" },
  { plat: "Dessert", nom: "Mango sticky rice au lait de coco", tag: "Maison", tagColor: "bg-pink-100 text-pink-600", icon: Sparkles,
    img: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=120&q=80" },
];

const gallery = [
  { src: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80", alt: "Wok flambé thaï", tall: true },
  { src: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", alt: "Dîner thaï dressé", tall: false },
  { src: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80", alt: "Green curry onctueux", tall: false },
  { src: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80", alt: "Épices thaïlandaises", tall: true },
];

const faqs = [
  { q: "Comment se déroule une prestation ?", a: "Notre cheffe arrive 1h avant le service avec tous les ingrédients. Elle prépare le menu devant vos yeux, dresse les assiettes et s'occupe de tout. Vous n'avez qu'à savourer." },
  { q: "Quelle zone géographique couvrez-vous ?", a: "Paris intra-muros et proche banlieue (92, 93, 94). Au-delà, un supplément déplacement peut s'appliquer — contactez-nous avant de réserver." },
  { q: "Peut-on personnaliser le menu ?", a: "Absolument. Lors de la réservation, vous pouvez indiquer vos préférences, allergies et le niveau d'épice souhaité. Le menu s'adapte à vous." },
  { q: "Quel matériel faut-il prévoir ?", a: "Juste une cuisine fonctionnelle avec un plan de travail libre. Notre cheffe apporte ses ustensiles et tous les ingrédients." },
  { q: "Puis-je annuler ou reporter ?", a: "Annulation gratuite jusqu'à 48h avant la prestation. En dessous de ce délai, un avoir de 50% est proposé pour une prochaine date." },
];

// ── Accordion FAQ ────────────────────────────────────────────
function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mx-auto mt-12 max-w-2xl space-y-3">
      {items.map((faq, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card transition-all"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          >
            <span className="text-[14px] font-semibold text-[var(--foreground)]">
              {faq.q}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-st-gold transition-transform duration-300 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                <p className="border-t border-[var(--border)] px-6 py-4 text-[13.5px] leading-relaxed text-[var(--st-warm-gray)]">
                  {faq.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function PrestationChefPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16 lg:pt-[72px]">

        {/* ══ 1. HERO ══════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          {/* background photo + overlay */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1585032226651-759b368d7246?w=1400&q=80"
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-st-navy/[0.92] via-[#1E2D4A]/90 to-[#1C1917]/95" />
          </div>
          <div className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full bg-st-gold/[0.08] blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-st-gold/[0.05] blur-[100px]" />

          <div className="st-section relative z-10 py-20 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">

              {/* left — text */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-st-gold/30 bg-st-gold/10 px-4 py-1.5"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-st-gold" />
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-st-gold">
                    Expérience unique
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-5 font-serif text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-[1.06] tracking-tight text-white"
                >
                  Votre cheffe
                  <br />
                  thaïlandaise{" "}
                  <span className="text-st-gold">à domicile</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-5 max-w-lg text-[15px] leading-[1.8] text-white/60"
                >
                  Un voyage culinaire sans quitter votre salon. Notre cheffe prépare
                  un festin authentique devant vos yeux, avec des recettes familiales
                  transmises depuis des générations.
                </motion.p>

                {/* stars */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 flex items-center gap-2"
                >
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-st-gold text-st-gold" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-white/80">4.9/5</span>
                  <span className="text-sm text-white/40">· 120+ avis vérifiés</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <Link
                    href="/panier/prestation"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-st-gold px-8 py-4 text-[13px] font-semibold text-white transition-all hover:bg-st-gold-hover hover:shadow-xl hover:shadow-st-gold/30"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Réserver une date
                  </Link>
                  <p className="text-[13px] text-white/50">
                    À partir de{" "}
                    <span className="font-bold text-white">80 €</span> pour 2 personnes
                  </p>
                </motion.div>

                {/* quick trust chips */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 flex flex-wrap gap-2"
                >
                  {[
                    "Courses incluses",
                    "Ustensiles apportés",
                    "Annulation 48h",
                    "Paris & IDF",
                  ].map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11.5px] font-medium text-white/60"
                    >
                      <Check className="h-3 w-3 text-st-gold" />
                      {t}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* right — visual composition */}
              <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.8 }}
                className="relative hidden lg:block"
              >
                {/* main card */}
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#243047] to-[#1C2840] p-8 shadow-2xl">
                  {/* photo cheffe */}
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=700&q=80"
                      alt="Cuisine thaïlandaise au wok"
                      className="h-56 w-full object-cover"
                    />
                  </div>

                  {/* menu preview strip */}
                  <div className="mt-5 space-y-2">
                    {["Pad Thaï", "Tom Kha Gai", "Green Curry"].map((plat, i) => (
                      <div key={plat} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2.5">
                        <span className="text-lg">{["🍜", "🥣", "🍛"][i]}</span>
                        <span className="text-[13px] font-medium text-white/80">{plat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* floating rating */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -left-8 top-10 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-lg"
                >
                  <p className="font-serif text-2xl font-bold text-white">250+</p>
                  <p className="text-[10px] text-white/50">Prestations réalisées</p>
                </motion.div>

                {/* floating next slot */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="absolute -bottom-4 right-4 rounded-2xl border border-st-gold/25 bg-st-gold/15 px-4 py-3 backdrop-blur-lg"
                >
                  <p className="text-[11px] font-bold text-st-gold">Prochaine dispo</p>
                  <p className="text-[11px] text-white/70">Samedi 19 avril · 2 places</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══ 2. TIMELINE ══════════════════════════════════ */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--st-cream)] via-[#FFF7ED]/60 to-[var(--st-cream)]" />

          <div className="st-section relative z-10">
            <div className="text-center">
              <span className="st-kicker">Le déroulement</span>
              <h2 className="st-heading mt-3">Comment ça se passe</h2>
            </div>

            <div className="relative mt-16">
              {/* connecting line */}
              <div className="pointer-events-none absolute left-[calc(50%-1px)] top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-st-gold/30 via-st-gold/15 to-transparent lg:block" />

              <div className="grid gap-8 lg:gap-12">
                {timeline.map((t, i) => (
                  <motion.div
                    key={t.step}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -32 : 32 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`flex items-center gap-8 ${i % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}
                  >
                    {/* card */}
                    <div className="flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${t.color} shadow-lg`}>
                          <t.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]/60">
                            Étape {t.step}
                          </p>
                          <h3 className="mt-1 font-serif text-lg font-bold text-[var(--foreground)] sm:text-xl">
                            {t.title}
                          </h3>
                          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--st-warm-gray)]">
                            {t.detail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* center dot (desktop) */}
                    <div className="hidden shrink-0 lg:flex">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${t.color} font-serif text-sm font-bold shadow-xl ring-4 ring-[var(--background)]`}>
                        {t.step}
                      </div>
                    </div>

                    {/* spacer */}
                    <div className="hidden flex-1 lg:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ 3. MENU SIGNATURE ════════════════════════════ */}
        <section className="py-20 lg:py-24">
          <div className="st-section">
            <div className="text-center">
              <span className="st-kicker">5 plats</span>
              <h2 className="st-heading mt-3">Notre menu signature</h2>
              <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[var(--st-warm-gray)]">
                Chaque plat est personnalisable selon vos goûts et allergies.
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
              className="mx-auto mt-12 max-w-2xl space-y-3"
            >
              {menu.map((m, i) => (
                <motion.div
                  key={m.nom}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut" } },
                  }}
                  className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-card p-3 transition-all hover:border-st-gold/20 hover:shadow-md sm:p-4"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <img src={m.img} alt={m.nom} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]/60">
                      {m.plat}
                    </p>
                    <p className="mt-0.5 truncate text-[14px] font-semibold text-[var(--foreground)]">
                      {m.nom}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${m.tagColor}`}>
                    {m.tag}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            <p className="mt-6 text-center text-[12px] text-[var(--st-warm-gray)]">
              Menu modifiable lors de la réservation · Versions végétariennes et sans gluten disponibles
            </p>
          </div>
        </section>

        {/* ══ 4. CE QUI EST INCLUS ═════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F0EB]/50 to-[var(--st-cream)] py-20 lg:py-24">
          <div className="st-section">
            <div className="text-center">
              <span className="st-kicker">Tout compris</span>
              <h2 className="st-heading mt-3">Ce qui est inclus</h2>
            </div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
              className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {inclus.map((item) => (
                <motion.div
                  key={item.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
                  }}
                  className="group flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-card p-5 transition-all hover:-translate-y-1 hover:border-st-gold/15 hover:shadow-lg"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[var(--foreground)]">{item.label}</p>
                    <p className="mt-0.5 text-[12px] text-[var(--st-warm-gray)]">{item.detail}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ 4b. GALERIE PHOTOS ═══════════════════════════ */}
        <section className="py-12 lg:py-16">
          <div className="st-section">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {gallery.map((g, i) => (
                <motion.div
                  key={g.src}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={`overflow-hidden rounded-2xl ${g.tall ? "row-span-2" : ""}`}
                >
                  <img
                    src={g.src}
                    alt={g.alt}
                    className={`w-full object-cover transition-transform duration-500 hover:scale-105 ${g.tall ? "h-64 sm:h-full" : "h-32 sm:h-40"}`}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 5. TARIFS ════════════════════════════════════ */}
        <section className="py-20 lg:py-24">
          <div className="st-section">
            <div className="text-center">
              <span className="st-kicker">Transparents</span>
              <h2 className="st-heading mt-3">Calculez votre tarif</h2>
              <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[var(--st-warm-gray)]">
                Ajustez le nombre de convives pour voir le prix exact, tout inclus.
              </p>
            </div>
            <PrestationPricing />
          </div>
        </section>

        {/* ══ 6. FAQ ═══════════════════════════════════════ */}
        <section className="bg-gradient-to-b from-[var(--st-cream)] to-white py-20 lg:py-24">
          <div className="st-section">
            <div className="text-center">
              <span className="st-kicker">Questions fréquentes</span>
              <h2 className="st-heading mt-3">Tout ce que vous devez savoir</h2>
            </div>
            <Accordion items={faqs} />

            <div className="mt-10 flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-[13px] font-semibold text-[var(--foreground)] transition-all hover:border-st-gold/30 hover:text-st-gold"
              >
                <MessageCircle className="h-4 w-4" />
                Une autre question ? Contactez-nous
              </Link>
            </div>
          </div>
        </section>

        {/* ══ 7. CTA FINAL ═════════════════════════════════ */}
        <section className="py-16 lg:py-24">
          <div className="st-section">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-st-charcoal via-[#292524] to-[#1C1917] px-8 py-16 text-center sm:px-16 lg:py-20"
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-st-gold/[0.09] blur-[100px]" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-[300px] w-[300px] rounded-full bg-st-navy/[0.3] blur-[80px]" />

              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-st-gold/25 bg-st-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-st-gold">
                  Prêt à vivre l&apos;expérience ?
                </span>
                <h2 className="mx-auto mt-6 max-w-xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Offrez un dîner thaïlandais
                  <span className="text-st-gold"> inoubliable</span>
                </h2>
                <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
                  Anniversaire, soirée entre amis, team building ou simple envie de voyage — notre cheffe s&apos;adapte à toutes les occasions.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/panier/prestation"
                    className="inline-flex items-center gap-2 rounded-full bg-st-gold px-8 py-4 text-[13px] font-semibold text-white transition-all hover:bg-st-gold-hover hover:shadow-xl hover:shadow-st-gold/30"
                  >
                    Réserver maintenant
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/boutique"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-8 py-4 text-[13px] font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
                  >
                    Voir nos kits cuisine
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
