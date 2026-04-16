import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Catégorie — Saveurs Thaï",
};

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--st-cream)] to-white py-12">
          <div className="st-section">
            <Link href="/boutique" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] transition-colors hover:text-st-gold">
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour boutique
            </Link>
            <h1 className="st-heading capitalize">{categorySlug.replace(/-/g, " ")}</h1>
          </div>
        </section>

        <section className="py-10">
          <div className="st-section">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="st-card flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-10 w-10 rounded-xl bg-[var(--st-gold-soft)]" />
                  <p className="mt-3 text-sm text-[var(--st-warm-gray)]">Produit {i + 1}</p>
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
