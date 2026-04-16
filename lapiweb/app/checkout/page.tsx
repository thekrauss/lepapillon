"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Lock, CreditCard, Truck, Loader2, ChefHat } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useProfile, useAddresses } from "@/hooks/useAuth";

export default function CheckoutPage() {
  const router = useRouter();
  const { accessToken, hasHydrated } = useAuthStore();
  const cart = useCartStore((s) => s.cart);

  const isLoggedIn = hasHydrated && !!accessToken;
  const { data: profile } = useProfile();
  const { data: addresses } = useAddresses();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  // Pre-fill from profile when available
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  // Pre-fill default address
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0];
      setStreet(defaultAddr.street ?? "");
      setPostalCode(defaultAddr.postal_code ?? "");
      setCity(defaultAddr.city ?? "");
    }
  }, [addresses]);

  const handlePay = () => {
    if (!isLoggedIn) {
      router.push("/connexion?redirect=/checkout");
      return;
    }
    // TODO: Stripe payment integration
  };

  const itemsTotal = cart?.items_total ?? 0;
  const prestationTotal = cart?.prestation_total ?? 0;
  const total = cart?.total ?? 0;
  const hasItems = (cart?.item_count ?? 0) > 0 || cart?.prestation !== null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n / 100);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-10">
          <div className="st-section">
            <h1 className="st-heading">Paiement</h1>

            {!hasItems ? (
              <p className="mt-8 text-center text-[var(--st-warm-gray)]">
                Votre panier est vide.
              </p>
            ) : (
              <div className="mt-8 grid gap-8 lg:grid-cols-3">
                {/* ── formulaire ───────────────────────────── */}
                <div className="space-y-8 lg:col-span-2">
                  {/* livraison */}
                  <div className="st-card">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-st-gold" />
                      <h2 className="font-sans text-lg font-bold">Livraison</h2>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[13px] font-semibold">Prenom</label>
                          <input
                            type="text"
                            className="st-input w-full"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[13px] font-semibold">Nom</label>
                          <input
                            type="text"
                            className="st-input w-full"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[13px] font-semibold">Adresse</label>
                        <input
                          type="text"
                          className="st-input w-full"
                          placeholder="Numero et rue"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-[13px] font-semibold">Code postal</label>
                          <input
                            type="text"
                            className="st-input w-full"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-[13px] font-semibold">Ville</label>
                          <input
                            type="text"
                            className="st-input w-full"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[13px] font-semibold">Telephone</label>
                        <input
                          type="tel"
                          className="st-input w-full"
                          placeholder="Pour le livreur"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* paiement */}
                  <div className="st-card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-st-gold" />
                      <h2 className="font-sans text-lg font-bold">Paiement</h2>
                    </div>
                    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-8 text-center">
                      <Lock className="mx-auto h-8 w-8 text-[var(--st-warm-gray)]/30" />
                      <p className="mt-3 text-[13px] text-[var(--st-warm-gray)]">
                        Paiement securise Stripe — sera integre ici.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── recap ────────────────────────────────── */}
                <div>
                  <div className="st-card sticky top-24">
                    <h2 className="font-sans text-lg font-bold">Votre commande</h2>
                    <div className="mt-5 space-y-3 text-[14px]">
                      {cart?.items.map((item) => (
                        <div key={item.product_id} className="flex justify-between">
                          <span className="text-[var(--st-warm-gray)]">
                            {item.product_name} x{item.quantity}
                          </span>
                          <span>{fmt(item.subtotal)}</span>
                        </div>
                      ))}
                      {cart?.prestation && (
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1 text-[var(--st-warm-gray)]">
                            <ChefHat className="h-3.5 w-3.5" /> Prestation Chef
                          </span>
                          <span>{fmt(cart.prestation.price)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[var(--st-warm-gray)]">Livraison</span>
                        <span className="text-st-forest">Gratuite</span>
                      </div>
                      <div className="border-t border-[var(--border)] pt-3">
                        <div className="flex justify-between text-lg">
                          <span className="font-bold">Total</span>
                          <span className="font-bold text-st-gold">{fmt(total)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handlePay}
                      className="st-btn-primary mt-6 w-full gap-2 py-3.5"
                    >
                      <Lock className="h-4 w-4" />
                      {isLoggedIn ? `Payer ${fmt(total)}` : "Se connecter pour payer"}
                    </button>
                    <p className="mt-3 text-center text-[11px] text-[var(--st-warm-gray)]">
                      Paiement 100% securise par Stripe
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
