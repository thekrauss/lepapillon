"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import {
  Users, MapPin, ArrowLeft, ChefHat, Loader2, AlertCircle,
  MessageSquare, Minus, Plus, CalendarDays, Check,
} from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAvailableSlots, usePrestationPricing } from "@/hooks/usePrestation";
import { useSetPrestation } from "@/hooks/usePanier";
import { useAddresses } from "@/hooks/useAuth";
import SlotCalendar from "@/components/shop/SlotCalendar";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

// ── Progress indicator ───────────────────────────────────────
const STEPS = [
  { label: "Créneau", icon: CalendarDays },
  { label: "Convives", icon: Users },
  { label: "Lieu", icon: MapPin },
  { label: "Notes", icon: MessageSquare },
];

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="mb-10 flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold transition-all ${
                  done
                    ? "bg-st-gold text-white shadow-md shadow-st-gold/25"
                    : active
                    ? "border-2 border-st-gold bg-white text-st-gold"
                    : "border-2 border-[var(--border)] bg-card text-[var(--st-warm-gray)]/50"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`hidden text-[10px] font-semibold sm:block ${
                  active ? "text-st-gold" : done ? "text-[var(--st-warm-gray)]" : "text-[var(--st-warm-gray)]/40"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-px flex-1 transition-all ${i < current ? "bg-st-gold/50" : "bg-[var(--border)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PrestationStepPage() {
  const router = useRouter();
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots();
  const { data: pricing, isLoading: pricingLoading } = usePrestationPricing();
  const { data: addresses } = useAddresses();
  const setPrestation = useSetPrestation();

  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [guestCount, setGuestCount] = useState(4);
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const defaultAddr = addresses?.find((a) => a.is_default) ?? addresses?.[0];

  const handleUseAddress = () => {
    if (defaultAddr) {
      setStreet(defaultAddr.street);
      setPostalCode(defaultAddr.postal_code);
      setCity(defaultAddr.city);
    }
  };

  const selectedSlot = slots?.find((s) => s.id === selectedSlotId);
  const minGuests = pricing?.min_guests ?? 2;
  const maxGuests = pricing?.max_guests ?? 12;
  const totalPrice = pricing ? pricing.base_price + pricing.price_per_person * guestCount : 0;

  // Compute current step for progress bar
  const currentStep = useMemo(() => {
    if (!selectedSlotId) return 0;
    if (guestCount === minGuests) return 1;
    if (!street || !city || !postalCode) return 2;
    return 3;
  }, [selectedSlotId, guestCount, minGuests, street, city, postalCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !street || !city || !postalCode) return;
    setPrestation.mutate(
      {
        date: selectedSlot.date,
        time_slot: selectedSlot.time_slot,
        street,
        city,
        postal_code: postalCode,
        guest_count: guestCount,
        notes,
      },
      { onSuccess: () => router.push("/panier") }
    );
  };

  const isLoading = slotsLoading || pricingLoading;
  const canSubmit = !!selectedSlotId && !!street && !!city && !!postalCode;

  return (
    <AuthGuard>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[var(--st-cream)]/60 to-white pt-16 lg:pt-[72px]">
        <section className="py-8 sm:py-12">
          <div className="st-section mx-auto max-w-4xl">
            <Link
              href="/panier"
              className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] transition-colors hover:text-st-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour au panier
            </Link>

            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-st-gold/10">
                <ChefHat className="h-7 w-7 text-st-gold" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold sm:text-3xl">
                  Réserver une prestation cheffe
                </h1>
                <p className="mt-0.5 text-[13px] text-[var(--st-warm-gray)]">
                  Notre cheffe se déplace chez vous avec tout le nécessaire.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                {/* ── Left : form ─────────────────────────── */}
                <div>
                  <ProgressBar current={currentStep} />

                  <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ── STEP 1 : Créneau ─────────────────── */}
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-sm">
                      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-st-gold text-[12px] font-bold text-white">
                          1
                        </span>
                        <h2 className="text-[15px] font-bold">Choisissez votre créneau</h2>
                        {selectedSlot && (
                          <span className="ml-auto flex items-center gap-1 rounded-full bg-st-forest/10 px-2.5 py-0.5 text-[11px] font-semibold text-st-forest">
                            <Check className="h-3 w-3" /> Sélectionné
                          </span>
                        )}
                      </div>
                      <div className="p-5 sm:p-6">
                        {!slots?.length ? (
                          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Aucun créneau disponible pour le moment. Revenez bientôt !
                          </div>
                        ) : (
                          <SlotCalendar
                            slots={slots}
                            selectedSlotId={selectedSlotId}
                            onSelect={setSelectedSlotId}
                          />
                        )}
                      </div>
                    </div>

                    {/* ── STEP 2 : Convives ─────────────────── */}
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-sm">
                      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-st-gold text-[12px] font-bold text-white">
                          2
                        </span>
                        <h2 className="text-[15px] font-bold">Nombre de convives</h2>
                      </div>
                      <div className="p-5 sm:p-6">
                        {/* +/- stepper */}
                        <div className="flex items-center justify-between rounded-2xl border-2 border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setGuestCount((g) => Math.max(minGuests, g - 1))}
                            disabled={guestCount <= minGuests}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-card text-[var(--foreground)] transition-all hover:border-st-gold/40 hover:text-st-gold disabled:opacity-30"
                          >
                            <Minus className="h-5 w-5" />
                          </button>

                          <div className="text-center">
                            <p className="font-serif text-5xl font-bold leading-none text-[var(--foreground)]">
                              {guestCount}
                            </p>
                            <p className="mt-1.5 text-[12px] text-[var(--st-warm-gray)]">
                              convive{guestCount > 1 ? "s" : ""} · {minGuests} min · {maxGuests} max
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setGuestCount((g) => Math.min(maxGuests, g + 1))}
                            disabled={guestCount >= maxGuests}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-card text-[var(--foreground)] transition-all hover:border-st-gold/40 hover:text-st-gold disabled:opacity-30"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>

                        {/* quick presets */}
                        {pricing && (
                          <div className="mt-3 flex gap-2">
                            {[2, 4, 6, 8, 10, 12]
                              .filter((n) => n >= minGuests && n <= maxGuests)
                              .map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setGuestCount(n)}
                                  className={`flex-1 rounded-xl py-2 text-[12px] font-bold transition-all ${
                                    guestCount === n
                                      ? "bg-st-gold text-white shadow-sm"
                                      : "border border-[var(--border)] bg-card text-[var(--st-warm-gray)] hover:border-st-gold/30"
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── STEP 3 : Adresse ──────────────────── */}
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-sm">
                      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-st-gold text-[12px] font-bold text-white">
                          3
                        </span>
                        <h2 className="text-[15px] font-bold">Lieu de la prestation</h2>
                      </div>
                      <div className="space-y-3 p-5 sm:p-6">
                        {defaultAddr && (
                          <button
                            type="button"
                            onClick={handleUseAddress}
                            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-st-gold/30 bg-st-gold/5 px-4 py-3 text-left text-[13px] transition-colors hover:border-st-gold/50 hover:bg-st-gold/8"
                          >
                            <MapPin className="h-4 w-4 shrink-0 text-st-gold" />
                            <span>
                              <span className="font-semibold">Utiliser mon adresse</span>
                              <span className="ml-1 text-[var(--st-warm-gray)]">
                                — {defaultAddr.street}, {defaultAddr.postal_code} {defaultAddr.city}
                              </span>
                            </span>
                          </button>
                        )}
                        <input
                          type="text"
                          className="st-input w-full"
                          placeholder="Numéro et rue"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            className="st-input w-full"
                            placeholder="Code postal"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            required
                          />
                          <input
                            type="text"
                            className="st-input w-full"
                            placeholder="Ville"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── STEP 4 : Notes ────────────────────── */}
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-sm">
                      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--muted)] text-[12px] font-bold text-[var(--st-warm-gray)]">
                          4
                        </span>
                        <h2 className="text-[15px] font-bold">
                          Instructions spéciales{" "}
                          <span className="text-[12px] font-normal text-[var(--st-warm-gray)]">
                            (optionnel)
                          </span>
                        </h2>
                      </div>
                      <div className="p-5 sm:p-6">
                        <textarea
                          className="st-input w-full resize-none"
                          rows={3}
                          placeholder="Allergies, régime alimentaire, occasion spéciale, code d'accès..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* ── Submit mobile ─────────────────────── */}
                    <div className="sticky bottom-0 z-20 -mx-5 border-t border-[var(--border)] bg-card/95 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:hidden">
                      <button
                        type="submit"
                        disabled={!canSubmit || setPrestation.isPending}
                        className="st-btn-primary w-full gap-2 py-4 disabled:opacity-50"
                      >
                        {setPrestation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Ajout en cours...
                          </>
                        ) : (
                          <>
                            <ChefHat className="h-4 w-4" />
                            Ajouter au panier · {pricing ? fmt(totalPrice) : ""}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ── Right : sticky recap ─────────────────── */}
                <div className="hidden lg:block">
                  <div className="sticky top-24 space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-sm">
                      <div className="border-b border-[var(--border)] bg-[var(--muted)]/30 px-5 py-4">
                        <h3 className="text-[14px] font-bold">Récapitulatif</h3>
                      </div>
                      <div className="space-y-3 p-5 text-[13px]">
                        {/* slot */}
                        <div className="flex items-start gap-3">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-st-gold" />
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">Créneau</p>
                            {selectedSlot ? (
                              <p className="text-[var(--st-warm-gray)]">
                                {new Date(selectedSlot.date).toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                })}{" "}
                                · {selectedSlot.time_slot}
                              </p>
                            ) : (
                              <p className="italic text-[var(--st-warm-gray)]/50">Non sélectionné</p>
                            )}
                          </div>
                        </div>

                        {/* guests */}
                        <div className="flex items-start gap-3">
                          <Users className="mt-0.5 h-4 w-4 shrink-0 text-st-gold" />
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">Convives</p>
                            <p className="text-[var(--st-warm-gray)]">
                              {guestCount} personne{guestCount > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        {/* address */}
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-st-gold" />
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">Lieu</p>
                            {street ? (
                              <p className="text-[var(--st-warm-gray)]">
                                {street}
                                {postalCode && city ? `, ${postalCode} ${city}` : ""}
                              </p>
                            ) : (
                              <p className="italic text-[var(--st-warm-gray)]/50">Non renseigné</p>
                            )}
                          </div>
                        </div>

                        {/* price */}
                        {pricing && (
                          <>
                            <div className="my-1 border-t border-[var(--border)]" />
                            <div className="space-y-1.5 text-[12px] text-[var(--st-warm-gray)]">
                              <div className="flex justify-between">
                                <span>Forfait base</span>
                                <span>{fmt(pricing.base_price)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{guestCount} × {fmt(pricing.price_per_person)}/pers.</span>
                                <span>{fmt(pricing.price_per_person * guestCount)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-st-gold/8 px-4 py-3">
                              <span className="text-[13px] font-bold text-[var(--foreground)]">Total</span>
                              <span className="font-serif text-xl font-bold text-st-gold">
                                {fmt(totalPrice)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      form=""
                      onClick={handleSubmit}
                      disabled={!canSubmit || setPrestation.isPending}
                      className="st-btn-primary w-full gap-2 py-4 disabled:opacity-50"
                    >
                      {setPrestation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Ajout en cours...
                        </>
                      ) : (
                        <>
                          <ChefHat className="h-4 w-4" />
                          Ajouter au panier
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-[var(--st-warm-gray)]">
                      Annulation gratuite 48h avant · Courses incluses
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </AuthGuard>
  );
}
