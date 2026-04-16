import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { Check, Package, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Confirmation — Saveurs Thaï",
};

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function ConfirmationPage({ params }: Props) {
  const { orderId } = await params;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-20">
          <div className="st-section mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-st-forest/10">
              <Check className="h-10 w-10 text-st-forest" />
            </div>
            <h1 className="mt-6 font-serif text-3xl font-bold">Merci pour votre commande !</h1>
            <p className="mt-3 text-[15px] text-[var(--st-warm-gray)]">
              Votre commande <span className="font-semibold text-[var(--foreground)]">#{orderId}</span> a bien été enregistrée.
            </p>

            <div className="st-card mt-8 text-left">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-st-gold" />
                <h2 className="font-sans text-[15px] font-bold">Récapitulatif</h2>
              </div>
              <div className="mt-4 space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[var(--st-warm-gray)]">Kit Pad Thaï x2</span>
                  <span>50,00 €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--st-warm-gray)]">Sauce Satay x1</span>
                  <span>12,00 €</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-st-gold">62,00 €</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/compte/commandes" className="st-btn-primary gap-2">
                Suivre ma commande <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/boutique" className="st-btn-secondary">
                Continuer mes achats
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
