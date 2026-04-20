"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays, ChefHat, Users, MapPin, Settings, Loader2,
  Package, Clock, Mail, ChevronDown, AlertTriangle, Euro,
  Printer, CheckCircle, Filter, StickyNote, Send, XCircle, Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useBookingDetails,
  useUpdatePrestationStatus,
  useSendPrestationReminder,
  useUpdateChefNotes,
  useCancelPrestationWithRefund,
} from "@/hooks/useAdmin";
import type { BookingDetailResponse } from "@/types/adminTypes";

// ── Helpers ──────────────────────────────────────────────────

const statusConfig: Record<string, { text: string; color: string; dot: string }> = {
  confirmed: { text: "Confirmée",  color: "bg-st-forest/10 text-st-forest", dot: "bg-st-forest" },
  completed: { text: "Terminée",   color: "bg-gray-100 text-gray-600",      dot: "bg-gray-400" },
  cancelled: { text: "Annulée",    color: "bg-red-50 text-red-600",         dot: "bg-red-400" },
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

type FilterKey = "all" | "upcoming" | "completed" | "cancelled";

// ── Print fiche ──────────────────────────────────────────────

function printFiche(b: BookingDetailResponse) {
  const items = (b.order_items ?? [])
    .map((it) => `<tr><td>${it.product_name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${fmt(it.price * it.quantity)}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Fiche — ${b.user_name} ${fmtDate(b.slot_date)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:32px auto;padding:24px;color:#1c1917}
  h1{font-size:1.5rem;font-weight:700;margin-bottom:4px}
  .subtitle{color:#78716c;font-size:.875rem;margin-bottom:24px}
  .section{margin-bottom:20px}
  .label{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:#78716c;margin-bottom:4px}
  .value{font-size:.95rem;font-weight:600}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  .badge{display:inline-block;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:999px;font-size:.75rem;font-weight:700;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;font-size:.875rem;margin-top:8px}
  th{background:#f5f0eb;padding:8px 12px;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#78716c}
  td{padding:8px 12px;border-bottom:1px solid #e7e0d8}
  .total{text-align:right;font-weight:700;font-size:1rem;margin-top:8px}
  .notes-box{background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-top:16px}
  .notes-label{font-size:.7rem;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e7e0d8;font-size:.75rem;color:#78716c;text-align:center}
</style></head><body>
<div class="badge">FICHE DE PRESTATION</div>
<h1>Prestation cheffe — ${b.user_name}</h1>
<div class="subtitle">Saveurs Thaï · Imprimée le ${new Date().toLocaleDateString("fr-FR")}</div>

<div class="grid">
  <div class="section">
    <div class="label">Date & heure</div>
    <div class="value">${fmtDate(b.slot_date)}</div>
    <div style="color:#78716c;font-size:.875rem">${b.time_slot}</div>
  </div>
  <div class="section">
    <div class="label">Convives</div>
    <div class="value" style="font-size:1.75rem">${b.guest_count}</div>
  </div>
  <div class="section">
    <div class="label">Client</div>
    <div class="value">${b.user_name}</div>
    <div style="color:#78716c;font-size:.875rem">${b.user_email}</div>
  </div>
  <div class="section">
    <div class="label">Adresse de la prestation</div>
    <div class="value">${b.address_street}</div>
    <div style="color:#78716c;font-size:.875rem">${b.address_postal_code} ${b.address_city}</div>
  </div>
</div>

${
  b.order_items?.length
    ? `<div class="section">
  <div class="label">Produits à préparer (${b.order_items.length})</div>
  <table>
    <thead><tr><th>Produit</th><th style="text-align:center">Qté</th><th style="text-align:right">Montant</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <div class="total">Total : ${fmt(b.order_total)}</div>
</div>`
    : ""
}

${
  b.notes
    ? `<div class="notes-box"><div class="notes-label">⚠ Instructions spéciales</div><div>${b.notes}</div></div>`
    : ""
}

<div class="footer">Fiche générée automatiquement par Saveurs Thaï · saveursthai.fr</div>
</body></html>`;

  const w = window.open("", "_blank", "width=780,height=900");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.print(); }, 300);
}

// ── KPI card ─────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, accent = false,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-st-gold/25 bg-st-gold/5" : "border-[var(--border)] bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? "bg-st-gold/15" : "bg-[var(--muted)]"}`}>
          <Icon className={`h-5 w-5 ${accent ? "text-st-gold" : "text-[var(--st-warm-gray)]"}`} />
        </div>
      </div>
      <p className={`mt-3 text-2xl font-bold ${accent ? "text-st-gold" : "text-[var(--foreground)]"}`}>{value}</p>
      <p className="text-[12px] font-semibold text-[var(--foreground)]/70">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[var(--st-warm-gray)]">{sub}</p>}
    </div>
  );
}

// ── Booking card ─────────────────────────────────────────────

function BookingCard({ b }: { b: BookingDetailResponse }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chefNotesDraft, setChefNotesDraft] = useState(b.chef_notes ?? "");
  const [notesSaved, setNotesSaved] = useState(true);

  const updateStatus = useUpdatePrestationStatus();
  const sendReminder = useSendPrestationReminder();
  const updateNotes = useUpdateChefNotes();
  const cancelBooking = useCancelPrestationWithRefund();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = new Date(b.slot_date) < today;
  const isActive = b.status === "confirmed";
  const st = statusConfig[b.status] ?? { text: b.status, color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  const itemCount = b.order_items?.length ?? 0;

  const handleSaveNotes = () => {
    updateNotes.mutate(
      { bookingId: b.booking_id, data: { notes: chefNotesDraft } },
      { onSuccess: () => setNotesSaved(true) }
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-sm">
      {/* compact header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--muted)]/30"
      >
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isPast ? "bg-[var(--muted)]" : "bg-st-gold/10"}`}>
          <ChefHat className={`h-5 w-5 ${isPast ? "text-[var(--st-warm-gray)]" : "text-st-gold"}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-bold">{b.user_name}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              {st.text}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[12px] text-[var(--st-warm-gray)]">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-st-gold/70" />
              {fmtDate(b.slot_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-st-gold/70" />
              {b.time_slot}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-st-gold/70" />
              {b.guest_count} conv.
            </span>
            {itemCount > 0 && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3 text-st-gold/70" />
                {itemCount} produit{itemCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="text-[14px] font-bold text-st-gold">{fmt(b.order_total)}</p>
          <ChevronDown className={`h-4 w-4 text-[var(--st-warm-gray)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* expanded detail */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-[var(--border)] px-5 py-5">
              {/* ── actions bar ─────────────────────────── */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                  Détails de la prestation
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => printFiche(b)}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-card px-3 py-2 text-[12px] font-semibold transition-colors hover:border-st-gold/30 hover:text-st-gold"
                  >
                    <Printer className="h-3.5 w-3.5" /> Imprimer
                  </button>

                  {isActive && (
                    <>
                      <button
                        onClick={() => sendReminder.mutate(b.booking_id)}
                        disabled={sendReminder.isPending}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {sendReminder.isPending ? "Envoi..." : "Rappel email"}
                      </button>

                      <button
                        onClick={() => updateStatus.mutate({ bookingId: b.booking_id, data: { status: "completed" } })}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 rounded-xl border border-st-forest/20 bg-st-forest/5 px-3 py-2 text-[12px] font-semibold text-st-forest transition-colors hover:bg-st-forest/10 disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Marquer terminée
                      </button>

                      <button
                        onClick={() => {
                          const reason = window.prompt("Raison de l'annulation (optionnel) :");
                          if (reason === null) return;
                          cancelBooking.mutate({
                            bookingId: b.booking_id,
                            data: { reason: reason || undefined, refund: true },
                          });
                        }}
                        disabled={cancelBooking.isPending}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {cancelBooking.isPending ? "Annulation..." : "Annuler + rembourser"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* client + lieu */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">Client</p>
                  <p className="font-semibold text-[13px]">{b.user_name}</p>
                  <p className="flex items-center gap-1.5 text-[12px] text-[var(--st-warm-gray)]">
                    <Mail className="h-3.5 w-3.5" /> {b.user_email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">Lieu</p>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-st-gold/70" />
                    {b.address_street}
                  </p>
                  <p className="pl-5 text-[12px] text-[var(--st-warm-gray)]">
                    {b.address_postal_code} {b.address_city}
                  </p>
                </div>
              </div>

              {/* client notes */}
              {b.notes && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Instructions spéciales du client
                    </p>
                    <p className="mt-0.5 text-[13px] text-amber-800">{b.notes}</p>
                  </div>
                </div>
              )}

              {/* chef notes */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                  <StickyNote className="h-3.5 w-3.5 text-st-gold/70" />
                  Notes internes (cheffe uniquement)
                </p>
                <textarea
                  value={chefNotesDraft}
                  onChange={(e) => { setChefNotesDraft(e.target.value); setNotesSaved(false); }}
                  rows={3}
                  placeholder="Notes préparation, allergies, remarques interne..."
                  className="st-input w-full resize-y text-[13px]"
                />
                {!notesSaved && (
                  <button
                    onClick={handleSaveNotes}
                    disabled={updateNotes.isPending}
                    className="mt-2 flex items-center gap-1.5 rounded-xl bg-st-gold/10 px-4 py-2 text-[12px] font-semibold text-st-gold-hover hover:bg-st-gold/20 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {updateNotes.isPending ? "Sauvegarde..." : "Sauvegarder les notes"}
                  </button>
                )}
              </div>

              {/* products */}
              {b.order_items && b.order_items.length > 0 && (
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                    Produits à préparer ({b.order_items.length})
                  </p>
                  <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                    {b.order_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-3 last:border-0"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)]">
                          <Package className="h-4 w-4 text-[var(--st-warm-gray)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold">{item.product_name}</p>
                          <p className="text-[11px] text-[var(--st-warm-gray)]">{fmt(item.price)} / unité</p>
                        </div>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-st-gold/10 text-[12px] font-bold text-st-gold">
                          ×{item.quantity}
                        </span>
                        <span className="w-20 text-right text-[13px] font-semibold">
                          {fmt(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2 text-[14px]">
                    <span className="text-[var(--st-warm-gray)]">Total :</span>
                    <span className="font-bold text-st-gold">{fmt(b.order_total)}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function AdminPrestationsPage() {
  const { data: bookings, isLoading } = useBookingDetails();
  const [filter, setFilter] = useState<FilterKey>("upcoming");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const kpis = useMemo(() => {
    if (!bookings) return null;
    const upcoming = bookings.filter(
      (b) => new Date(b.slot_date) >= today && b.status !== "cancelled"
    );
    const thisMonth = bookings.filter((b) => {
      const d = new Date(b.slot_date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const revenue = thisMonth.reduce((s, b) => s + b.order_total, 0);
    const next = upcoming.sort((a, b) => a.slot_date.localeCompare(b.slot_date))[0];
    return { upcomingCount: upcoming.length, monthRevenue: revenue, total: bookings.length, next };
  }, [bookings]);

  const filtered = useMemo(() => {
    if (!bookings) return [];
    switch (filter) {
      case "upcoming":
        return bookings
          .filter((b) => new Date(b.slot_date) >= today && b.status !== "cancelled")
          .sort((a, b) => a.slot_date.localeCompare(b.slot_date));
      case "completed":
        return bookings.filter((b) => b.status === "completed");
      case "cancelled":
        return bookings.filter((b) => b.status === "cancelled");
      default:
        return [...bookings].sort((a, b) => b.slot_date.localeCompare(a.slot_date));
    }
  }, [bookings, filter]);

  const FILTERS: { key: FilterKey; label: string; count?: number }[] = [
    { key: "all",       label: "Toutes",    count: bookings?.length },
    { key: "upcoming",  label: "À venir",   count: kpis?.upcomingCount },
    { key: "completed", label: "Terminées", count: bookings?.filter((b) => b.status === "completed").length },
    { key: "cancelled", label: "Annulées",  count: bookings?.filter((b) => b.status === "cancelled").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-bold">Prestations</h1>
          <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">
            {bookings?.length ?? 0} réservation(s) au total
          </p>
        </div>
        <Link href="/admin/prestations/creneaux" className="st-btn-secondary gap-1.5 text-[13px]">
          <Settings className="h-4 w-4" /> Gérer les créneaux
        </Link>
      </div>

      {kpis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={CalendarDays} label="Prestations à venir"  value={String(kpis.upcomingCount)} sub="Non annulées" accent />
          <KpiCard icon={Euro}         label="CA prestations ce mois" value={fmt(kpis.monthRevenue)} />
          <KpiCard icon={CheckCircle}  label="Total réservations"   value={String(kpis.total)} />
          <KpiCard
            icon={ChefHat}
            label="Prochain créneau"
            value={kpis.next ? fmtShort(kpis.next.slot_date) : "—"}
            sub={kpis.next ? `${kpis.next.user_name} · ${kpis.next.guest_count} conv.` : "Aucun"}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Filter className="h-4 w-4 self-center text-[var(--st-warm-gray)]" />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
              filter === f.key
                ? "bg-st-gold text-white shadow-sm shadow-st-gold/20"
                : "border border-[var(--border)] bg-card text-[var(--foreground)]/70 hover:border-st-gold/30"
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === f.key ? "bg-white/25" : "bg-[var(--muted)]"}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-card py-16 text-center">
          <CalendarDays className="h-10 w-10 text-[var(--st-warm-gray)]/30" />
          <p className="mt-3 text-[14px] text-[var(--st-warm-gray)]">Aucune prestation dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard key={b.booking_id} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}
