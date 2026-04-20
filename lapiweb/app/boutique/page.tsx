import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import BoutiqueContent from "@/components/shop/BoutiqueContent";
import CartDrawer from "@/components/shop/CartDrawer";
import MarqueeStrip from "@/components/shop/MarqueeStrip";

export const metadata: Metadata = {
  title: "Boutique — Saveurs Thaï",
  description:
    "Découvrez nos kits de cuisine thaïlandaise, sauces, épices et ingrédients artisanaux.",
};

const highlights = [
  { label: "Kits complets", color: "bg-amber-100 text-amber-700" },
  { label: "Sauces maison", color: "bg-orange-100 text-orange-700" },
  { label: "Épices & herbes", color: "bg-green-100 text-green-700" },
  { label: "Ingrédients frais", color: "bg-blue-100 text-blue-700" },
];

export default function BoutiquePage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen pt-16 lg:pt-[72px]">
        {/* ── Hero éditorial ─────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-br from-[var(--st-cream)] via-[#FFF7ED] to-[#F5F0EB]">
          {/* decorative blob */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-st-gold/[0.07] blur-[120px]" />

          <div className="st-section relative z-10 py-14 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              {/* left — text */}
              <div>
                <span className="st-kicker">Notre sélection</span>
                <h1 className="st-heading mt-2 text-[clamp(2rem,4vw,3.5rem)]">
                  Tous nos produits
                </h1>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--st-warm-gray)]">
                  Ingrédients authentiques importés de Thaïlande, kits prêts à cuisiner
                  et sauces artisanales — pour recréer Bangkok dans votre cuisine.
                </p>

                {/* category pills */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {highlights.map((h) => (
                    <span
                      key={h.label}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${h.color}`}
                    >
                      {h.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* right — decorative stat cards */}
              <div className="hidden items-center justify-end gap-4 lg:flex">
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                    <p className="font-serif text-3xl font-bold text-st-charcoal">30+</p>
                    <p className="mt-0.5 text-[12px] text-st-warm-gray">Produits disponibles</p>
                  </div>
                  <div className="rounded-2xl border border-st-gold/20 bg-st-gold/5 p-5">
                    <p className="font-serif text-3xl font-bold text-st-gold">24h</p>
                    <p className="mt-0.5 text-[12px] text-st-warm-gray">Délai de livraison</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                  <p className="font-serif text-3xl font-bold text-st-charcoal">100%</p>
                  <p className="mt-1 max-w-[120px] text-[12px] leading-relaxed text-st-warm-gray">
                    Authentique, importé directement
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MarqueeStrip />

        {/* ── Produits ───────────────────────────────────────── */}
        <section className="py-10">
          <div className="st-section">
            <BoutiqueContent />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
