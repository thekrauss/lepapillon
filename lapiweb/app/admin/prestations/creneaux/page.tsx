"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Lock, Unlock, Plus, Loader2, Clock, Users } from "lucide-react";
import { useAdminSlots, useCreateSlot, useBlockSlot, useUnblockSlot } from "@/hooks/useAdmin";

const statusConfig = {
  available: { text: "Disponible", color: "bg-st-forest/10 text-st-forest" },
  booked: { text: "Reserve", color: "bg-st-gold/10 text-st-gold-hover" },
  blocked: { text: "Bloque", color: "bg-red-50 text-red-500" },
} as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });

export default function CreneauxPage() {
  const { data: slots, isLoading } = useAdminSlots();
  const createSlot = useCreateSlot();
  const blockSlot = useBlockSlot();
  const unblockSlot = useUnblockSlot();

  const [showNew, setShowNew] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");

  const handleCreate = () => {
    if (!newDate || !startTime || !endTime) return;
    createSlot.mutate({ date: newDate, time_slot: `${startTime}-${endTime}` }, {
      onSuccess: () => { setShowNew(false); setNewDate(""); setStartTime("19:00"); setEndTime("21:00"); },
    });
  };

  const countByStatus = (s: string) => slots?.filter((sl) => sl.status === s).length ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/admin/prestations" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Prestations
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Gerer les creneaux</h1>
          <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">
            {slots?.length ?? 0} creneaux — {countByStatus("available")} dispo, {countByStatus("booked")} reserves, {countByStatus("blocked")} bloques
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="st-btn-primary gap-1.5 text-[13px]">
          <Plus className="h-4 w-4" /> Nouveau creneau
        </button>
      </div>

      {/* New slot form */}
      {showNew && (
        <div className="st-card space-y-4">
          <h3 className="text-[14px] font-bold">Ajouter un creneau</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Date</label>
              <input type="date" className="st-input w-full" value={newDate} onChange={(e) => setNewDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Heure debut</label>
              <input type="time" className="st-input w-full" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Heure fin</label>
              <input type="time" className="st-input w-full" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleCreate} disabled={!newDate || !startTime || !endTime || createSlot.isPending} className="st-btn-primary gap-1 py-2.5 text-[13px] disabled:opacity-50">
                {createSlot.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Creer
              </button>
              <button onClick={() => setShowNew(false)} className="st-btn-secondary py-2.5 text-[13px]">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Slots list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
        </div>
      ) : !slots?.length ? (
        <div className="st-card py-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-[var(--st-warm-gray)]/30" />
          <p className="mt-3 text-[14px] text-[var(--st-warm-gray)]">Aucun creneau configure.</p>
        </div>
      ) : (
        <div className="st-card overflow-x-auto p-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Horaire</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Reservation</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => {
                const st = statusConfig[s.status] ?? statusConfig.available;
                return (
                  <tr key={s.id} className={`border-b border-[var(--border)] last:border-0 ${s.status === "booked" ? "bg-st-gold/[0.03]" : ""}`}>
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
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.color}`}>{st.text}</span>
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
                      {s.status === "booked" ? (
                        <span className="text-[11px] text-[var(--st-warm-gray)]">Reserve</span>
                      ) : s.status === "available" ? (
                        <button
                          onClick={() => blockSlot.mutate(s.id)}
                          disabled={blockSlot.isPending}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-[11px] font-medium text-[var(--st-warm-gray)] transition-colors hover:border-red-200 hover:text-red-500 ml-auto"
                        >
                          <Lock className="h-3 w-3" /> Bloquer
                        </button>
                      ) : (
                        <button
                          onClick={() => unblockSlot.mutate(s.id)}
                          disabled={unblockSlot.isPending}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-[11px] font-medium text-[var(--st-warm-gray)] transition-colors hover:border-st-forest/30 hover:text-st-forest ml-auto"
                        >
                          <Unlock className="h-3 w-3" /> Debloquer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
