import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { User, MapPin, Package, ChefHat, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Mon compte — Saveurs Thaï",
};

const menuItems = [
  { icon: User, label: "Mes informations", description: "Nom, email, téléphone", href: "/compte/profil" },
  { icon: MapPin, label: "Mes adresses", description: "Gérer les adresses de livraison", href: "/compte/adresses" },
  { icon: Package, label: "Mes commandes", description: "Historique et suivi", href: "/compte/commandes" },
  { icon: ChefHat, label: "Mes prestations", description: "Réservations à venir et passées", href: "/compte/prestations" },
];

export default function ComptePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--st-cream)] to-white py-12">
          <div className="st-section">
            <span className="st-kicker">Espace client</span>
            <h1 className="st-heading mt-2">Mon compte</h1>
            <p className="mt-1 text-[15px] text-[var(--st-warm-gray)]">
              Bienvenue ! Gérez votre profil, commandes et prestations.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="st-section mx-auto max-w-2xl">
            <div className="space-y-3">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} className="st-card group flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:border-st-gold/20 hover:shadow-md">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-st-gold/10 transition-colors group-hover:bg-st-gold/15">
                    <item.icon className="h-5 w-5 text-st-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-[15px] font-bold">{item.label}</p>
                    <p className="text-[12px] text-[var(--st-warm-gray)]">{item.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--st-warm-gray)] transition-transform group-hover:translate-x-0.5 group-hover:text-st-gold" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
