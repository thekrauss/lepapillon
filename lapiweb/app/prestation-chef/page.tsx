import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { ChefHat, Clock, UtensilsCrossed, ShoppingBag, Sparkles, Users, MapPin, CalendarDays, Star, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import PrestationPricing from "@/components/shop/PrestationPricing";
import ImageParallax from "@/components/ImageParallax";

export const metadata: Metadata = {
  title: "Prestation Chef à Domicile — Saveurs Thaï",
  description: "Faites venir notre cheffe thaïlandaise chez vous. Menu sur mesure, ingrédients frais, ambiance authentique.",
};

const inclus = [
  { icon: UtensilsCrossed, label: "Menu 5 plats", detail: "Entrée, soupe, 2 plats, dessert" },
  { icon: ShoppingBag, label: "Courses incluses", detail: "Tous les ingrédients frais" },
  { icon: Clock, label: "3h de prestation", detail: "Préparation et service" },
  { icon: Sparkles, label: "Décoration thaïe", detail: "Ambiance authentique" },
  { icon: MapPin, label: "À domicile", detail: "Paris et Île-de-France" },
  { icon: Users, label: "2 à 12 convives", detail: "Format intimiste ou repas de groupe" },
];

// Tarifs are now loaded dynamically via PrestationPricing component

const faqs = [
  { q: "Comment se déroule une prestation ?", a: "Notre cheffe arrive 1h avant le service avec tous les ingrédients. Elle prépare le menu devant vos yeux, dresse les assiettes et s'occupe de tout. Vous n'avez qu'à savourer." },
  { q: "Quelle zone géographique couvrez-vous ?", a: "Paris intra-muros et proche banlieue (92, 93, 94). Au-delà, un supplément déplacement peut s'appliquer." },
  { q: "Peut-on personnaliser le menu ?", a: "Absolument. Lors de la réservation, vous pouvez indiquer vos préférences, allergies et le niveau d'épice souhaité." },
  { q: "Quel matériel faut-il prévoir ?", a: "Juste une cuisine fonctionnelle avec un plan de travail libre. Notre cheffe apporte ses ustensiles et ingrédients." },
];

export default function PrestationChefPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-18">
        {/* ── Hero prestation ────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[var(--st-cream)] to-white py-10">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[400px] w-[600px] rounded-full bg-st-navy/[0.04] blur-[120px]" />
          <div className="st-section relative z-10">
            <div className="mx-auto max-w-2xl text-center">
              <span className="st-kicker">Expérience unique</span>
              <h1 className="st-heading mt-3 text-4xl sm:text-5xl">
                Votre cheffe thaïlandaise<br />
                <span className="text-st-navy">à domicile</span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--st-warm-gray)]">
                Un voyage culinaire sans quitter votre salon. Notre cheffe
                prépare un menu authentique devant vos yeux avec des ingrédients
                frais et des recettes familiales.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link href="/panier/prestation" className="st-btn-primary gap-2 px-7 py-3.5 bg-black">
                  <CalendarDays className="h-4 w-4" />
                  Réserver une date
                </Link>
              </div>
              <div className="mx-auto mt-6 flex items-center justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-st-gold text-st-gold" />
                ))}
                <span className="ml-2 text-sm text-[var(--st-warm-gray)]">4.9/5 — 120+ avis</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ce qui est inclus ──────────────────────────── */}
        {/* ── Ce qui est inclus (AVEC PARALLAX ET VERRE) ── */}
        <section className="relative overflow-hidden py-24">
          
          {/* 1. L'Image Parallax en fond */}
          <div className="absolute inset-0 z-0">
            <ImageParallax 
              src="/images/boutique.jpg" // À remplacer par une photo de préparation ou d'ingrédients
              alt="Préparation par la cheffe"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Voile crème un peu opaque (60%) pour ne pas gêner la lecture des cartes */}
            <div className="absolute inset-0 bg-st-cream/60 backdrop-blur-[2px]" />
          </div>

          <div className="st-section relative z-10">
            
            {/* 2. En-tête avec fond flouté */}
            <div className="mx-auto max-w-2xl rounded-2xl bg-white/40 p-8 text-center backdrop-blur-md border border-white/20 shadow-sm">
              <span className="st-kicker">Tout compris</span>
              <h2 className="st-heading mt-3">Ce qui est inclus</h2>
            </div>
            
            {/* 3. Les cartes transformées en Glassmorphism */}
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {inclus.map((item) => (
                <div 
                  key={item.label} 
                  className="group flex items-start gap-4 rounded-2xl border border-white/40 bg-white/70 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-st-gold/30 hover:bg-white/90 hover:shadow-xl"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-st-gold shadow-sm">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[var(--st-charcoal)]">{item.label}</p>
                    <p className="mt-1 text-[12px] font-medium text-[var(--st-warm-gray)]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Tarifs ─────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-[#F5F0EB]/40 to-white py-20">
          <div className="st-section">
            <div className="text-center">
              <span className="st-kicker">Transparents</span>
              <h2 className="st-heading mt-3">Nos tarifs</h2>
            </div>
            <PrestationPricing />
          </div>
        </section>

        {/* ── FAQ (AVEC PARALLAX ET GLASSMORPHISM) ───────── */}
        <section className="relative overflow-hidden py-24">
          
          {/* 1. L'Image Parallax en fond */}
          <div className="absolute inset-0 z-0">
            <ImageParallax 
              src="/images/boutique.jpg" // À remplacer par une photo d'ambiance (ex: cuisine, épices)
              alt="Questions fréquentes"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Voile crème pour garantir une lecture parfaite du texte */}
            <div className="absolute inset-0 bg-st-cream/60 backdrop-blur-[2px]" />
          </div>

          <div className="st-section relative z-10">
            
            {/* 2. En-tête avec effet "Verre" */}
            <div className="mx-auto max-w-2xl rounded-2xl bg-white/40 p-8 text-center backdrop-blur-md border border-white/20 shadow-sm">
              <span className="st-kicker">Questions fréquentes</span>
              <h2 className="st-heading mt-3">FAQ</h2>
            </div>
            
            {/* 3. Les cartes FAQ en Glassmorphism */}
            <div className="mx-auto mt-12 max-w-2xl space-y-4">
              {faqs.map((faq) => (
                <div 
                  key={faq.q} 
                  className="group rounded-2xl border border-white/40 bg-white/70 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-st-gold/30 hover:bg-white/90 hover:shadow-lg"
                >
                  <p className="font-sans text-[15px] font-bold text-[var(--st-charcoal)]">
                    {faq.q}
                  </p>
                  <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-[var(--st-warm-gray)]">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
            
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
