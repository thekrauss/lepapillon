"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { Users, MapPin, ArrowLeft, ChefHat, Loader2, AlertCircle, MessageSquare, Euro } from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAvailableSlots, usePrestationPricing } from "@/hooks/usePrestation";
import { useSetPrestation } from "@/hooks/usePanier";
import { useAddresses } from "@/hooks/useAuth";
import SlotCalendar from "@/components/shop/SlotCalendar";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);


export default function PrestationStepPage() {
  const router = useRouter();
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots();
  const { data: pricing, isLoading: pricingLoading } = usePrestationPricing();
  const { data: addresses } = useAddresses();
  const setPrestation = useSetPrestation();

  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [guestCount, setGuestCount] = useState(2);
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [useExistingAddress, setUseExistingAddress] = useState(false);

  // Pre-fill from default address
  const defaultAddr = addresses?.find((a) => a.is_default) ?? addresses?.[0];
  const handleUseAddress = () => {
    if (defaultAddr) {
      setStreet(defaultAddr.street);
      setPostalCode(defaultAddr.postal_code);
      setCity(defaultAddr.city);
      setUseExistingAddress(true);
    }
  };

  const selectedSlot = slots?.find((s) => s.id === selectedSlotId);
  const minGuests = pricing?.min_guests ?? 2;
  const maxGuests = pricing?.max_guests ?? 12;
  const totalPrice = pricing ? pricing.base_price + pricing.price_per_person * guestCount : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !street || !city || !postalCode) return;
    setPrestation.mutate({
      date: selectedSlot.date,
      time_slot: selectedSlot.time_slot,
      street,
      city,
      postal_code: postalCode,
      guest_count: guestCount,
      notes,
    }, {
      onSuccess: () => router.push("/panier"),
    });
  };

  const isLoading = slotsLoading || pricingLoading;
  const canSubmit = !!selectedSlotId && !!street && !!city && !!postalCode;

  return (
    <AuthGuard>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[var(--st-cream)]/50 to-white pt-20">
        <section className="py-8 sm:py-10">
          <div className="st-section mx-auto max-w-3xl">
            <Link href="/panier" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] transition-colors hover:text-st-gold">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour au panier
            </Link>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-st-gold/10">
                <ChefHat className="h-6 w-6 text-st-gold" />
              </div>
              <div>
                <h1 className="font-sans text-xl font-bold sm:text-2xl">Reserver une prestation cheffe</h1>
                <p className="mt-0.5 text-[13px] text-[var(--st-warm-gray)]">Notre cheffe se deplace chez vous avec tout le necessaire.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="mt-16 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-8">

                {/* ── STEP 1 : Creneau (calendrier) ──────── */}
                <div className="st-card space-y-4 p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-st-gold text-[12px] font-bold text-white">1</span>
                    <h2 className="text-[15px] font-bold">Choisissez votre creneau</h2>
                  </div>

                  {!slots?.length ? (
                    <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-[13px] text-yellow-800">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Aucun creneau disponible pour le moment.
                    </div>
                  ) : (
                    <SlotCalendar
                      slots={slots}
                      selectedSlotId={selectedSlotId}
                      onSelect={setSelectedSlotId}
                    />
                  )}
                </div>

                {/* ── STEP 2 : Convives ─────────────────────── */}
                <div className="st-card space-y-4 p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-st-gold text-[12px] font-bold text-white">2</span>
                    <h2 className="text-[15px] font-bold">Nombre de convives</h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="range"
                        min={minGuests}
                        max={maxGuests}
                        value={guestCount}
                        onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                        className="w-full accent-[var(--st-gold)]"
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-[var(--st-warm-gray)]">
                        <span>{minGuests} min</span>
                        <span>{maxGuests} max</span>
                      </div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-st-gold/30 bg-st-gold/5 text-[18px] font-bold text-st-gold-hover">
                      {guestCount}
                    </div>
                  </div>

                  {pricing && (
                    <div className="flex items-center justify-between rounded-xl bg-[var(--muted)]/50 px-4 py-3">
                      <div className="text-[13px] text-[var(--st-warm-gray)]">
                        <Euro className="mr-1 inline h-3.5 w-3.5 text-st-gold" />
                        {fmt(pricing.base_price)} + {fmt(pricing.price_per_person)}/pers. x {guestCount}
                      </div>
                      <span className="text-[18px] font-bold text-st-gold">{fmt(totalPrice)}</span>
                    </div>
                  )}
                </div>

                {/* ── STEP 3 : Adresse ──────────────────────── */}
                <div className="st-card space-y-4 p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-st-gold text-[12px] font-bold text-white">3</span>
                    <h2 className="text-[15px] font-bold">Lieu de la prestation</h2>
                  </div>

                  {defaultAddr && !useExistingAddress && (
                    <button
                      type="button"
                      onClick={handleUseAddress}
                      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-st-gold/30 bg-st-gold/5 px-4 py-3 text-left text-[13px] transition-colors hover:border-st-gold/50"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-st-gold" />
                      <div className="flex-1">
                        <span className="font-semibold">Utiliser mon adresse</span>
                        <span className="ml-1 text-[var(--st-warm-gray)]">— {defaultAddr.street}, {defaultAddr.postal_code} {defaultAddr.city}</span>
                      </div>
                    </button>
                  )}

                  <input
                    type="text"
                    className="st-input w-full"
                    placeholder="Numero et rue"
                    value={street}
                    onChange={(e) => { setStreet(e.target.value); setUseExistingAddress(false); }}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="st-input w-full"
                      placeholder="Code postal"
                      value={postalCode}
                      onChange={(e) => { setPostalCode(e.target.value); setUseExistingAddress(false); }}
                      required
                    />
                    <input
                      type="text"
                      className="st-input w-full"
                      placeholder="Ville"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setUseExistingAddress(false); }}
                      required
                    />
                  </div>
                </div>

                {/* ── STEP 4 : Notes ────────────────────────── */}
                <div className="st-card space-y-4 p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-st-gold" />
                    <h2 className="text-[15px] font-bold">Instructions speciales <span className="text-[12px] font-normal text-[var(--st-warm-gray)]">(optionnel)</span></h2>
                  </div>
                  <textarea
                    className="st-input w-full"
                    rows={3}
                    placeholder="Allergies, regime alimentaire, occasion speciale, code d'acces..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* ── Submit ────────────────────────────────── */}
                <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--border)] bg-card/95 px-4 py-4 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {totalPrice > 0 && (
                      <div className="text-center sm:text-left">
                        <p className="text-[12px] text-[var(--st-warm-gray)]">Total prestation</p>
                        <p className="text-xl font-bold text-st-gold">{fmt(totalPrice)}</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={!canSubmit || setPrestation.isPending}
                      className="st-btn-primary w-full gap-2 py-3.5 sm:w-auto sm:px-10 disabled:opacity-50"
                    >
                      {setPrestation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Ajout en cours...</>
                      ) : (
                        <>
                          Ajouter au panier
                          <ChefHat className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </AuthGuard>
  );
}
