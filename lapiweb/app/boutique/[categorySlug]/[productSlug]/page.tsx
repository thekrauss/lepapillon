import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import CartDrawer from "@/components/shop/CartDrawer";
import ProductDetail from "@/components/shop/ProductDetail";

export const metadata: Metadata = {
  title: "Fiche produit — Saveurs Thai",
};

interface Props {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { categorySlug, productSlug } = await params;

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen pt-20">
        <ProductDetail categorySlug={categorySlug} productSlug={productSlug} />
      </main>
      <Footer />
    </>
  );
}
