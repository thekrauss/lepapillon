"use client";

import { useState } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Trash2, Loader2, Check, Star } from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAddresses, useCreateAddress, useDeleteAddress } from "@/hooks/useAuth";

export default function AdressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();

  const [showNew, setShowNew] = useState(false);
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !postalCode) return;
    createAddress.mutate({
      label: label || "Adresse",
      street,
      city,
      postal_code: postalCode,
      is_default: !addresses?.length,
    }, {
      onSuccess: () => { setShowNew(false); setLabel(""); setStreet(""); setPostalCode(""); setCity(""); },
    });
  };

  return (
    <AuthGuard>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-10">
          <div className="st-section mx-auto max-w-2xl">
            <Link href="/compte" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
              <ArrowLeft className="h-3.5 w-3.5" /> Mon compte
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="st-heading">Mes adresses</h1>
              <button onClick={() => setShowNew(true)} className="st-btn-primary gap-1.5 text-[13px]">
                <Plus className="h-4 w-4" /> Ajouter
              </button>
            </div>

            {isLoading ? (
              <div className="mt-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {showNew && (
                  <form onSubmit={handleCreate} className="st-card space-y-4">
                    <h3 className="text-[14px] font-bold">Nouvelle adresse</h3>
                    <input type="text" className="st-input w-full" placeholder="Nom (ex: Domicile, Bureau)" value={label} onChange={(e) => setLabel(e.target.value)} />
                    <input type="text" className="st-input w-full" placeholder="Numero et rue" value={street} onChange={(e) => setStreet(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" className="st-input w-full" placeholder="Code postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                      <input type="text" className="st-input w-full" placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} required />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={createAddress.isPending} className="st-btn-primary gap-1 text-[13px] disabled:opacity-50">
                        {createAddress.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Enregistrer
                      </button>
                      <button type="button" onClick={() => setShowNew(false)} className="st-btn-secondary text-[13px]">Annuler</button>
                    </div>
                  </form>
                )}

                {addresses?.map((a) => (
                  <div key={a.id} className="st-card flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-st-gold" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold">{a.label || "Adresse"}</p>
                          {a.is_default && (
                            <span className="flex items-center gap-0.5 rounded-full bg-st-gold/10 px-2 py-0.5 text-[10px] font-bold text-st-gold">
                              <Star className="h-2.5 w-2.5" /> Par defaut
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[13px] text-[var(--st-warm-gray)]">
                          {a.street}<br />{a.postal_code} {a.city}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { if (confirm("Supprimer cette adresse ?")) deleteAddress.mutate(a.id); }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--st-warm-gray)] transition-colors hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {!addresses?.length && !showNew && (
                  <p className="py-8 text-center text-[14px] text-[var(--st-warm-gray)]">Aucune adresse enregistree.</p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </AuthGuard>
  );
}
