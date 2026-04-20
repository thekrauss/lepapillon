import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { ChefHat, Heart, Leaf, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "À propos — Saveurs Thaï",
  description: "L'histoire de Saveurs Thaï, notre cheffe et notre partenariat avec l'épicerie thaïlandaise.",
};

const values = [
  { icon: Heart, title: "Authenticité", text: "Des recettes familiales transmises depuis des générations, jamais de raccourcis." },
  { icon: Leaf, title: "Qualité", text: "Ingrédients importés directement de Thaïlande et produits frais locaux." },
  { icon: Store, title: "Circuit court", text: "Partenariat avec une épicerie thaïlandaise parisienne pour la fraîcheur." },
  { icon: ChefHat, title: "Savoir-faire", text: "Notre cheffe partage sa passion et son expertise à chaque prestation." },
];

export default function AProposPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-18">
        {/* Hero */}
        <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--st-cream)] to-white py-20">
          <div className="st-section mx-auto max-w-3xl text-center">
            <span className="st-kicker">Notre histoire</span>
            <h1 className="st-heading mt-3 text-4xl sm:text-5xl">De Bangkok à votre table</h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--st-warm-gray)]">
              Saveurs Thaï est née de la passion d&apos;une cheffe thaïlandaise
              installée à Paris et de son envie de faire découvrir la vraie
              cuisine de son pays — loin des clichés, avec des ingrédients
              authentiques.
            </p>
          </div>
        </section>

        {/* La cheffe */}
        <section className="py-20">
          <div className="st-section">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#FFF7ED] to-[#F5F0EB]">
                <ChefHat className="h-16 w-16 text-[var(--foreground)]/[0.06]" />
              </div>
              <div>
                <span className="st-kicker">La cheffe</span>
                <h2 className="st-heading mt-3">Une passion familiale</h2>
                <p className="mt-4 text-[15px] leading-[1.8] text-[var(--st-warm-gray)]">
                  Originaire de Bangkok, notre cheffe cuisine depuis son enfance
                  aux côtés de sa mère et sa grand-mère. Installée à Paris depuis
                  plus de 10 ans, elle a d&apos;abord travaillé dans les meilleurs
                  restaurants thaïlandais de la capitale avant de créer Saveurs Thaï.
                </p>
                <p className="mt-3 text-[15px] leading-[1.8] text-[var(--st-warm-gray)]">
                  Sa mission : vous faire vivre un véritable voyage culinaire en
                  Thaïlande, que ce soit à travers nos kits de cuisine prêts à
                  préparer ou lors d&apos;une prestation à domicile.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Valeurs */}
        <section className="bg-gradient-to-b from-[#F5F0EB]/40 to-white py-20">
          <div className="st-section">
            <div className="text-center">
              <span className="st-kicker">Nos valeurs</span>
              <h2 className="st-heading mt-3">Ce qui nous anime</h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v) => (
                <div key={v.title} className="st-card text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-st-gold/10">
                    <v.icon className="h-6 w-6 text-st-gold" />
                  </div>
                  <h3 className="mt-4 font-sans text-[15px] font-bold">{v.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--st-warm-gray)]">{v.text}</p>
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
