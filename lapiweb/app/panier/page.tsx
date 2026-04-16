import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import CartPageContent from "@/components/shop/CartPage";

export const metadata: Metadata = {
  title: "Panier — Saveurs Thai",
};

export default function PanierPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-10">
          <div className="st-section">
            <h1 className="st-heading">Votre panier</h1>
            <div className="mt-8">
              <CartPageContent />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
