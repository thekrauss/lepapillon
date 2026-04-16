"use client";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { ArrowLeft, ChefHat, CalendarDays, Users, MapPin, Clock, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useUserBookings } from "@/hooks/usePrestation";

const statusConfig: Record<string, { text: string; color: string }> = {
  confirmed: { text: "A venir", color: "bg-st-gold/10 text-st-gold-hover" },
  completed: { text: "Terminee", color: "bg-[var(--muted)] text-[var(--st-warm-gray)]" },
  cancelled: { text: "Annulee", color: "bg-red-50 text-red-600" },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function PrestationsClientPage() {
  const { data: bookings, isLoading } = useUserBookings();

  return (
    <AuthGuard>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-10">
          <div className="st-section mx-auto max-w-2xl">
            <Link href="/compte" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
              <ArrowLeft className="h-3.5 w-3.5" /> Mon compte
            </Link>
            <h1 className="st-heading">Mes prestations</h1>

            {isLoading ? (
              <div className="mt-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
              </div>
            ) : !bookings?.length ? (
              <div className="mt-8 text-center">
                <p className="text-[14px] text-[var(--st-warm-gray)]">Aucune prestation reservee.</p>
                <Link href="/panier/prestation" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-st-gold hover:text-st-gold-hover">
                  <ChefHat className="h-4 w-4" /> Reserver une prestation
                </Link>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {bookings.map((b) => {
                  const st = statusConfig[b.status] ?? { text: b.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <div key={b.id} className="st-card">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-st-gold/10">
                            <ChefHat className="h-5 w-5 text-st-gold" />
                          </div>
                          <div>
                            <p className="font-sans text-[14px] font-bold">Prestation cheffe</p>
                            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.color}`}>
                              {st.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                        <div className="flex items-center gap-2 text-[var(--st-warm-gray)]">
                          <CalendarDays className="h-3.5 w-3.5 text-st-gold" />
                          {b.slot ? fmtDate(b.slot.date) : "Date a confirmer"}
                        </div>
                        <div className="flex items-center gap-2 text-[var(--st-warm-gray)]">
                          <Clock className="h-3.5 w-3.5 text-st-gold" />
                          {b.slot?.time_slot ?? "-"}
                        </div>
                        <div className="flex items-center gap-2 text-[var(--st-warm-gray)]">
                          <Users className="h-3.5 w-3.5 text-st-gold" />
                          {b.guest_count} convives
                        </div>
                        <div className="flex items-center gap-2 text-[var(--st-warm-gray)]">
                          <MapPin className="h-3.5 w-3.5 text-st-gold" />
                          {b.address_postal_code} {b.address_city}
                        </div>
                      </div>
                      {b.notes && (
                        <p className="mt-3 rounded-lg bg-[var(--muted)]/50 px-3 py-2 text-[12px] text-[var(--st-warm-gray)]">
                          {b.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </AuthGuard>
  );
}
