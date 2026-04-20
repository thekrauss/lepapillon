import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import BoutiqueContent from "@/components/shop/BoutiqueContent";
import CartDrawer from "@/components/shop/CartDrawer";

export const metadata: Metadata = {
  title: "Boutique — Saveurs Thai",
  description: "Decouvrez nos kits de cuisine thailandaise, sauces, epices et ingredients artisanaux.",
};

export default function BoutiquePage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen pt-18">
        {/* Hero */}
        <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--st-cream)] to-white py-12">
          <div className="st-section">
            <span className="st-kicker">Notre selection</span>
            <h1 className="st-heading mt-2">Tous nos produits</h1>
            <p className="mt-2 max-w-lg text-[15px] text-[var(--st-warm-gray)]">
              Ingredients authentiques importes de Thailande, kits prets a cuisiner et sauces artisanales.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-0">
          <div >
            <BoutiqueContent />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
