import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — Saveurs Thaï",
};

export default function CgvPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-16">
          <div className="st-section mx-auto max-w-3xl">
            <h1 className="st-heading">Conditions Générales de Vente</h1>
            <p className="mt-2 text-sm text-[var(--st-warm-gray)]">Dernière mise à jour : avril 2026</p>
            <div className="mt-10 space-y-8 text-[14px] leading-[1.8] text-[var(--st-warm-gray)]">
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Article 1 — Objet</h2>
                <p className="mt-2">Les présentes CGV régissent les ventes de produits et prestations proposés par Saveurs Thaï via le site saveursthai.fr.</p>
              </section>
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Article 2 — Produits et tarifs</h2>
                <p className="mt-2">Les produits proposés sont décrits sur le site. Les prix sont indiqués en euros TTC. Saveurs Thaï se réserve le droit de modifier ses prix à tout moment.</p>
              </section>
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Article 3 — Commandes</h2>
                <p className="mt-2">Toute commande implique l&apos;acceptation des présentes CGV. La validation de la commande vaut conclusion du contrat de vente.</p>
              </section>
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Article 4 — Livraison</h2>
                <p className="mt-2">La livraison est assurée à Paris et en Île-de-France. Les délais indiqués sont estimatifs.</p>
              </section>
              <section>
                <h2 className="font-sans text-lg font-bold text-[var(--foreground)]">Article 5 — Droit de rétractation</h2>
                <p className="mt-2">Conformément au Code de la consommation, le client dispose d&apos;un délai de 14 jours pour exercer son droit de rétractation, sauf pour les denrées périssables et les prestations de service dont l&apos;exécution a commencé.</p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
