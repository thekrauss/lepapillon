"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, Lock, Unlock, Plus, Loader2, Clock,
  Users, List, Calendar, RotateCcw, X, Check,
} from "lucide-react";
import { useAdminSlots, useCreateSlot, useBlockSlot, useUnblockSlot } from "@/hooks/useAdmin";
import type { AdminSlotResponse } from "@/types/adminTypes";
import type { CreateSlotRequest } from "@/types/prestationTypes";
import { toast } from "sonner";
import * as adminDAL from "@/DAL/admin";

// ── helpers ──────────────────────────────────────────────────────────

const statusConfig = {
  available: { text: "Disponible", color: "bg-st-forest/10 text-st-forest", dot: "bg-st-forest" },
  booked:    { text: "Réservé",    color: "bg-st-gold/10 text-st-gold-hover", dot: "bg-st-gold" },
  blocked:   { text: "Bloqué",     color: "bg-red-50 text-red-500", dot: "bg-red-400" },
} as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });

const fmtMonthYear = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
// JS getDay() is 0=Sun, map to Mon=0..Sun=6
const jsDayToMon = (d: number) => (d + 6) % 7;

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ── Calendar cell dot indicators ────────────────────────────────────

interface DayDots { available: number; booked: number; blocked: number }

function buildDayMap(slots: AdminSlotResponse[]): Map<string, DayDots> {
  const map = new Map<string, DayDots>();
  for (const s of slots) {
    const key = s.date.slice(0, 10);
    const prev = map.get(key) ?? { available: 0, booked: 0, blocked: 0 };
    prev[s.status as keyof DayDots] = (prev[s.status as keyof DayDots] ?? 0) + 1;
    map.set(key, prev);
  }
  return map;
}

// ── Sub-components ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: "available" | "booked" | "blocked" }) {
  const cfg = statusConfig[status] ?? statusConfig.available;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.text}
    </span>
  );
}

// ── New slot form (single) ───────────────────────────────────────────

function NewSlotForm({ onClose, prefillDate }: { onClose: () => void; prefillDate?: string }) {
  const createSlot = useCreateSlot();
  const [date, setDate] = useState(prefillDate ?? "");
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("21:00");
  const today = new Date().toISOString().split("T")[0];

  const handle = () => {
    if (!date || !start || !end) return;
    createSlot.mutate({ date, time_slot: `${start}-${end}` }, { onSuccess: onClose });
  };

  return (
    <div className="st-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold">Ajouter un créneau</h3>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--st-warm-gray)] hover:bg-[var(--muted)]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Date</label>
          <input type="date" className="st-input w-full" value={date} min={today}
            onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Heure début</label>
          <input type="time" className="st-input w-full" value={start}
            onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Heure fin</label>
          <input type="time" className="st-input w-full" value={end}
            onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={handle}
            disabled={!date || !start || !end || createSlot.isPending}
            className="st-btn-primary gap-1 py-2.5 text-[13px] disabled:opacity-50">
            {createSlot.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Créer
          </button>
          <button onClick={onClose} className="st-btn-secondary py-2.5 text-[13px]">Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ── Recurring slot form ──────────────────────────────────────────────

function RecurringForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [days, setDays] = useState<number[]>([]); // 0=Mon..6=Sun
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("21:00");
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);

  const toggleDay = (d: number) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const handle = async () => {
    if (!days.length || !start || !end || weeks < 1) return;
    setLoading(true);
    const slots: CreateSlotRequest[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let w = 0; w < weeks; w++) {
      for (const dow of days) {
        // dow: 0=Mon..6=Sun, JS: 0=Sun..6=Sat
        const jsDow = (dow + 1) % 7; // Mon=1..Sun=0
        const d = new Date(now);
        d.setDate(d.getDate() + ((jsDow - d.getDay() + 7) % 7) + w * 7);
        if (d <= now) d.setDate(d.getDate() + 7);
        slots.push({ date: d.toISOString().split("T")[0], time_slot: `${start}-${end}` });
      }
    }

    // deduplicate
    const unique = slots.filter((s, i, arr) =>
      arr.findIndex((x) => x.date === s.date && x.time_slot === s.time_slot) === i
    );

    try {
      await Promise.all(unique.map((s) => adminDAL.createSlot(s)));
      await qc.invalidateQueries({ queryKey: ["admin-slots"] });
      await qc.invalidateQueries({ queryKey: ["prestation-slots"] });
      toast.success(`${unique.length} créneau${unique.length > 1 ? "x" : ""} créé${unique.length > 1 ? "s" : ""}`);
      onClose();
    } catch {
      toast.error("Erreur lors de la création des créneaux");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold">Créneaux récurrents</h3>
          <p className="mt-0.5 text-[12px] text-[var(--st-warm-gray)]">
            Génère automatiquement des créneaux sur plusieurs semaines
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--st-warm-gray)] hover:bg-[var(--muted)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Day picker */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold">Jours de la semaine</label>
        <div className="flex flex-wrap gap-2">
          {DAYS_FULL.map((d, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`rounded-xl px-4 py-2 text-[12px] font-bold transition-all ${
                days.includes(i)
                  ? "bg-st-gold text-white shadow-md shadow-st-gold/25"
                  : "bg-[var(--muted)] text-[var(--st-warm-gray)] hover:bg-[var(--border)]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Heure début</label>
          <input type="time" className="st-input w-full" value={start}
            onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Heure fin</label>
          <input type="time" className="st-input w-full" value={end}
            onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Nombre de semaines</label>
          <input type="number" min={1} max={52} className="st-input w-full" value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))} />
        </div>
      </div>

      {days.length > 0 && (
        <p className="text-[12px] text-[var(--st-warm-gray)]">
          → Environ <strong className="text-[var(--foreground)]">{days.length * weeks}</strong> créneaux
          seront générés ({days.map((d) => DAYS_FULL[d]).join(", ")} · {start}–{end} · {weeks} sem.)
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handle}
          disabled={!days.length || loading}
          className="st-btn-primary gap-1.5 text-[13px] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Générer les créneaux
        </button>
        <button onClick={onClose} className="st-btn-secondary text-[13px]">Annuler</button>
      </div>
    </div>
  );
}

// ── Calendar view ────────────────────────────────────────────────────

function CalendarView({
  slots,
  onSelectDate,
  selectedDate,
}: {
  slots: AdminSlotResponse[];
  onSelectDate: (d: string) => void;
  selectedDate: string | null;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const dayMap = useMemo(() => buildDayMap(slots), [slots]);

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = jsDayToMon(firstDay.getDay());
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const todayKey = today.toISOString().split("T")[0];

  return (
    <div className="st-card">
      {/* Month nav */}
      <div className="mb-5 flex items-center justify-between">
        <button onClick={prev} className="rounded-lg p-2 text-[var(--st-warm-gray)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="font-sans text-[15px] font-bold capitalize">{fmtMonthYear(year, month)}</h3>
        <button onClick={next} className="rounded-lg p-2 text-[var(--st-warm-gray)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 text-center">
        {DAYS_FR.map((d) => (
          <div key={d} className="py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = isoDate(year, month, day);
          const dots = dayMap.get(key);
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const isPast = key < todayKey;

          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              className={`relative flex flex-col items-center rounded-xl px-1 py-2 transition-all ${
                isSelected
                  ? "bg-st-gold text-white shadow-md shadow-st-gold/30"
                  : isToday
                  ? "border border-st-gold/40 bg-st-gold/5 text-st-gold-hover"
                  : isPast
                  ? "text-[var(--foreground)]/30"
                  : "hover:bg-[var(--muted)] text-[var(--foreground)]"
              }`}
            >
              <span className="text-[13px] font-semibold leading-none">{day}</span>
              {dots && (
                <div className="mt-1.5 flex gap-0.5">
                  {dots.available > 0 && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-st-forest"}`} />
                  )}
                  {dots.booked > 0 && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-st-gold"}`} />
                  )}
                  {dots.blocked > 0 && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-red-400"}`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 border-t border-[var(--border)] pt-4 text-[11px] text-[var(--st-warm-gray)]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-st-forest" /> Disponible</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-st-gold" /> Réservé</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Bloqué</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

type ViewMode = "list" | "calendar";
type Modal = "none" | "new" | "recurring";

export default function CreneauxPage() {
  const { data: slots, isLoading } = useAdminSlots();
  const blockSlot = useBlockSlot();
  const unblockSlot = useUnblockSlot();

  const [view, setView] = useState<ViewMode>("list");
  const [modal, setModal] = useState<Modal>("none");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const countByStatus = (s: string) => slots?.filter((sl) => sl.status === s).length ?? 0;

  const slotsForDate = useMemo(
    () => (selectedDate ? (slots ?? []).filter((s) => s.date.slice(0, 10) === selectedDate) : []),
    [slots, selectedDate]
  );

  const handleSelectDate = (d: string) => {
    setSelectedDate((prev) => (prev === d ? null : d));
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/prestations"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Prestations
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold">Gérer les créneaux</h1>
          <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">
            {slots?.length ?? 0} créneaux —{" "}
            <span className="text-st-forest">{countByStatus("available")} dispo</span>,{" "}
            <span className="text-st-gold-hover">{countByStatus("booked")} réservés</span>,{" "}
            <span className="text-red-400">{countByStatus("blocked")} bloqués</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-[var(--border)] p-0.5">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                view === "list" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--st-warm-gray)] hover:text-[var(--foreground)]"
              }`}
            >
              <List className="h-3.5 w-3.5" /> Liste
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                view === "calendar" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--st-warm-gray)] hover:text-[var(--foreground)]"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Calendrier
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={() => setModal("recurring")}
            className="st-btn-secondary flex items-center gap-1.5 text-[13px]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Récurrents
          </button>
          <button
            onClick={() => setModal("new")}
            className="st-btn-primary flex items-center gap-1.5 text-[13px]"
          >
            <Plus className="h-4 w-4" /> Nouveau
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal === "new" && (
        <NewSlotForm
          onClose={() => setModal("none")}
          prefillDate={selectedDate ?? undefined}
        />
      )}
      {modal === "recurring" && <RecurringForm onClose={() => setModal("none")} />}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
        </div>
      ) : !slots?.length ? (
        <div className="st-card py-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-[var(--st-warm-gray)]/30" />
          <p className="mt-3 text-[14px] text-[var(--st-warm-gray)]">Aucun créneau configuré.</p>
          <button
            onClick={() => setModal("new")}
            className="st-btn-primary mx-auto mt-4 flex items-center gap-1.5 text-[13px]"
          >
            <Plus className="h-4 w-4" /> Créer le premier créneau
          </button>
        </div>
      ) : view === "calendar" ? (
        /* ── CALENDAR VIEW ── */
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <CalendarView
            slots={slots}
            onSelectDate={handleSelectDate}
            selectedDate={selectedDate}
          />

          {/* Side panel */}
          <div className="space-y-4">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-[14px] font-bold">
                    {fmtDate(selectedDate)}
                  </h3>
                  <button
                    onClick={() => { setModal("new"); }}
                    className="flex items-center gap-1 rounded-lg bg-st-gold/10 px-2.5 py-1.5 text-[11px] font-bold text-st-gold-hover hover:bg-st-gold/20"
                  >
                    <Plus className="h-3 w-3" /> Ajouter
                  </button>
                </div>

                {slotsForDate.length === 0 ? (
                  <div className="st-card py-8 text-center text-[13px] text-[var(--st-warm-gray)]">
                    Pas de créneau ce jour.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slotsForDate.map((s) => (
                      <div
                        key={s.id}
                        className="st-card flex items-center justify-between gap-3 p-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-st-gold" />
                            <span className="text-[13px] font-semibold">{s.time_slot}</span>
                          </div>
                          <StatusBadge status={s.status} />
                          {s.status === "booked" && s.booked_by && (
                            <p className="flex items-center gap-1 text-[11px] text-[var(--st-warm-gray)]">
                              <Users className="h-3 w-3" />
                              {s.booked_by} · {s.guest_count} convives
                            </p>
                          )}
                        </div>
                        <SlotActions s={s} blockSlot={blockSlot} unblockSlot={unblockSlot} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="st-card py-10 text-center text-[13px] text-[var(--st-warm-gray)]">
                <CalendarDays className="mx-auto mb-3 h-8 w-8 opacity-30" />
                Cliquez sur un jour pour voir ses créneaux
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="st-card overflow-x-auto p-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Horaire</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Réservation</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    s.status === "booked" ? "bg-st-gold/[0.03]" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[var(--st-warm-gray)]" />
                      <span className="font-semibold">{fmtDate(s.date)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-[var(--st-warm-gray)]">
                      <Clock className="h-3.5 w-3.5 text-st-gold" />
                      {s.time_slot}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-4">
                    {s.status === "booked" && s.booked_by ? (
                      <div>
                        <p className="text-[12px] font-medium">{s.booked_by}</p>
                        <p className="flex items-center gap-1 text-[11px] text-[var(--st-warm-gray)]">
                          <Users className="h-3 w-3" /> {s.guest_count} convives
                        </p>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[var(--st-warm-gray)]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <SlotActions s={s} blockSlot={blockSlot} unblockSlot={unblockSlot} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Slot action buttons ───────────────────────────────────────────────

function SlotActions({
  s,
  blockSlot,
  unblockSlot,
}: {
  s: AdminSlotResponse;
  blockSlot: ReturnType<typeof useBlockSlot>;
  unblockSlot: ReturnType<typeof useUnblockSlot>;
}) {
  if (s.status === "booked") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-[var(--st-warm-gray)]">
        <Check className="h-3 w-3 text-st-gold" /> Réservé
      </span>
    );
  }
  if (s.status === "available") {
    return (
      <button
        onClick={() => blockSlot.mutate(s.id)}
        disabled={blockSlot.isPending}
        className="ml-auto flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-[11px] font-medium text-[var(--st-warm-gray)] transition-colors hover:border-red-200 hover:text-red-500"
      >
        <Lock className="h-3 w-3" /> Bloquer
      </button>
    );
  }
  return (
    <button
      onClick={() => unblockSlot.mutate(s.id)}
      disabled={unblockSlot.isPending}
      className="ml-auto flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-[11px] font-medium text-[var(--st-warm-gray)] transition-colors hover:border-st-forest/30 hover:text-st-forest"
    >
      <Unlock className="h-3 w-3" /> Débloquer
    </button>
  );
}
