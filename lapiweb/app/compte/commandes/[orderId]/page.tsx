import type { Metadata } from "next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { ArrowLeft, Package, Truck, Check } from "lucide-react";

export const metadata: Metadata = { title: "Détail commande — Saveurs Thaï" };

interface Props {
  params: Promise<{ orderId: string }>;
}

const timeline = [
  { label: "Commande confirmée", date: "12 avril 2026 — 14h30", done: true },
  { label: "En préparation", date: "12 avril 2026 — 15h00", done: true },
  { label: "Expédiée", date: "13 avril 2026 — 09h00", done: true },
  { label: "Livrée", date: "13 avril 2026 — 17h30", done: false },
];

export default async function CommandeDetailPage({ params }: Props) {
  const { orderId } = await params;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-10">
          <div className="st-section mx-auto max-w-2xl">
            <Link href="/compte/commandes" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
              <ArrowLeft className="h-3.5 w-3.5" /> Mes commandes
            </Link>

            <div className="flex items-center justify-between">
              <h1 className="st-heading">Commande #{orderId}</h1>
              <span className="st-badge-success">En cours</span>
            </div>

            {/* timeline */}
            <div className="st-card mt-8">
              <h2 className="flex items-center gap-2 font-sans text-[15px] font-bold">
                <Truck className="h-5 w-5 text-st-gold" />
                Suivi
              </h2>
              <div className="mt-5 space-y-4">
                {timeline.map((step, i) => (
                  <div key={step.label} className="flex items-start gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${step.done ? "bg-st-forest text-white" : "border-2 border-[var(--border)] bg-white"}`}>
                        {step.done && <Check className="h-3.5 w-3.5" />}
                      </div>
                      {i < timeline.length - 1 && (
                        <div className={`mt-1 h-8 w-0.5 ${step.done ? "bg-st-forest/30" : "bg-[var(--border)]"}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-[13px] font-semibold ${step.done ? "text-[var(--foreground)]" : "text-[var(--st-warm-gray)]"}`}>
                        {step.label}
                      </p>
                      <p className="text-[11px] text-[var(--st-warm-gray)]">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* articles */}
            <div className="st-card mt-4">
              <h2 className="flex items-center gap-2 font-sans text-[15px] font-bold">
                <Package className="h-5 w-5 text-st-gold" />
                Articles
              </h2>
              <div className="mt-4 space-y-3 text-[14px]">
                <div className="flex justify-between"><span>Kit Pad Thaï x2</span><span>50,00 €</span></div>
                <div className="flex justify-between"><span>Sauce Satay x1</span><span>12,00 €</span></div>
                <div className="border-t border-[var(--border)] pt-3 flex justify-between font-bold">
                  <span>Total</span><span className="text-st-gold">62,00 €</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
