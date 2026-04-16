import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "Mentions légales — Saveurs Thaï",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-16">
          <div className="st-section mx-auto max-w-3xl">
            <h1 className="st-heading">Mentions légales</h1>
            <p className="mt-2 text-sm text-[var(--st-warm-gray)]">Dernière mise à jour : avril 2026</p>
            <div className="mt-10 space-y-8 text-[14px] leading-[1.8] text-[var(--st-warm-gray)]">
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Éditeur du site</h2>
                <p className="mt-2">Saveurs Thaï — Entreprise individuelle<br />Adresse : Paris, France<br />Email : contact@saveursthai.fr<br />SIRET : [à compléter]</p>
              </section>
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Hébergement</h2>
                <p className="mt-2">Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
              </section>
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Propriété intellectuelle</h2>
                <p className="mt-2">L&apos;ensemble du contenu de ce site (textes, images, graphismes, logo) est la propriété exclusive de Saveurs Thaï. Toute reproduction est interdite sans autorisation.</p>
              </section>
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Données personnelles</h2>
                <p className="mt-2">Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Contact : contact@saveursthai.fr</p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
