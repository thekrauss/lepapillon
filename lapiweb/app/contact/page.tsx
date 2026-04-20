import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Mail, MapPin, Phone } from "lucide-react";
import ImageParallax from "@/components/ImageParallax";

export const metadata: Metadata = {
  title: "Contact — Saveurs Thaï",
  description: "Contactez-nous pour toute question sur nos produits ou nos prestations chef à domicile.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-18">
        <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--st-cream)] to-white py-16">
          <div className="st-section mx-auto max-w-2xl text-center">
            <span className="st-kicker">Une question ?</span>
            <h1 className="st-heading mt-3">Contactez-nous</h1>
            <p className="mt-3 text-[15px] text-[var(--st-warm-gray)]">
              Notre équipe vous répond sous 24h.
            </p>
          </div>
        </section>

        <section className="relative w-full overflow-hidden py-16 lg:py-24">
          
          {/* 1. L'Image Parallax en fond */}
          <div className="absolute inset-0 z-0 h-full w-full">
            <ImageParallax 
              src="/images/boutique.jpg" // À remplacer par ton image
              alt="Contactez Saveurs Thaï"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Voile crème pour adoucir le fond */}
            <div className="absolute inset-0 bg-st-cream/70 backdrop-blur-[2px]" />
          </div>

          <div className="st-section relative z-10 mx-auto w-full">
            <div className="mx-auto grid max-w-4xl gap-12 lg:grid-cols-5">
              
              {/* formulaire (Dans une carte en verre, mais contenu INCHANGÉ) */}
              <div className="lg:col-span-3 rounded-3xl border border-white/50 bg-white/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
                <form className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold">Prénom</label>
                      <input type="text" className="st-input w-full" placeholder="Votre prénom" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold">Nom</label>
                      <input type="text" className="st-input w-full" placeholder="Votre nom" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold">Email</label>
                    <input type="email" className="st-input w-full" placeholder="votre@email.com" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold">Sujet</label>
                    <select className="st-input w-full">
                      <option value="">Choisir un sujet</option>
                      <option>Question sur un produit</option>
                      <option>Prestation chef à domicile</option>
                      <option>Suivi de commande</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold">Message</label>
                    <textarea className="st-input min-h-[140px] w-full resize-y" placeholder="Votre message…" />
                  </div>
                  <button type="submit" className="st-btn-primary w-full py-3.5 sm:w-auto sm:px-10">
                    Envoyer le message
                  </button>
                </form>
              </div>

              {/* coordonnées (Aussi dans une carte en verre) */}
              <div className="flex flex-col justify-center space-y-6 lg:col-span-2 rounded-3xl border border-white/40 bg-white/50 p-6 shadow-lg backdrop-blur-md sm:p-8">
                {[
                  { icon: Mail, label: "Email", value: "contact@saveursthai.fr" },
                  { icon: Phone, label: "Téléphone", value: "01 23 45 67 89" },
                  { icon: MapPin, label: "Adresse", value: "Paris, France" },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-st-gold/10">
                      <c.icon className="h-5 w-5 text-st-gold" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold">{c.label}</p>
                      <p className="text-[13px] text-[var(--st-warm-gray)]">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
