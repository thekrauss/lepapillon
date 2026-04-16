"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Check } from "lucide-react";
import type { SlotResponse } from "@/types/prestationTypes";

interface Props {
  slots: SlotResponse[];
  selectedSlotId: string;
  onSelect: (slotId: string) => void;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: string, b: Date) {
  const da = new Date(a);
  return da.getFullYear() === b.getFullYear() && da.getMonth() === b.getMonth() && da.getDate() === b.getDate();
}

export default function SlotCalendar({ slots, selectedSlotId, onSelect }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Map date string → slots
  const slotsByDate = useMemo(() => {
    const map = new Map<string, SlotResponse[]>();
    slots.forEach((s) => {
      const key = s.date.split("T")[0];
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    });
    return map;
  }, [slots]);

  // Available dates set for quick lookup
  const availableDates = useMemo(() => new Set(slotsByDate.keys()), [slotsByDate]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    // Monday = 0
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < startDow; i++) cells.push(null);
    // Days
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    // Trailing to fill row
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewMonth]);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const canPrev = viewMonth > startOfMonth(today);

  // Slots for selected date
  const selectedDateKey = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}` : null;
  const slotsForDate = selectedDateKey ? slotsByDate.get(selectedDateKey) ?? [] : [];

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <button
            onClick={prevMonth}
            disabled={!canPrev}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--muted)] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[14px] font-bold">
            {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--muted)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--muted)]/30">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const hasSlots = availableDates.has(dateKey);
            const isPast = date < today;
            const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
            const isToday = date.getTime() === today.getTime();

            return (
              <button
                key={dateKey}
                disabled={!hasSlots || isPast}
                onClick={() => setSelectedDate(date)}
                className={`relative flex aspect-square flex-col items-center justify-center text-[13px] transition-all
                  ${isPast || !hasSlots ? "text-[var(--st-warm-gray)]/40 cursor-default" : "hover:bg-st-gold/5 cursor-pointer"}
                  ${isSelected ? "bg-st-gold/10 font-bold text-st-gold-hover" : ""}
                  ${isToday && !isSelected ? "font-bold" : ""}
                `}
              >
                {date.getDate()}
                {hasSlots && !isPast && (
                  <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${isSelected ? "bg-st-gold" : "bg-st-gold/60"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot picker for selected date */}
      {selectedDate && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
            Creneaux du {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>

          {slotsForDate.length === 0 ? (
            <p className="rounded-xl bg-[var(--muted)]/50 px-4 py-3 text-[13px] text-[var(--st-warm-gray)]">
              Aucun creneau disponible ce jour.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slotsForDate.map((s) => {
                const active = selectedSlotId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-3 text-[13px] font-semibold transition-all ${
                      active
                        ? "border-st-gold bg-st-gold/10 text-st-gold-hover shadow-sm"
                        : "border-[var(--border)] hover:border-st-gold/40 hover:bg-st-gold/5"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {s.time_slot}
                    {active && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected recap */}
      {selectedSlot && (
        <div className="rounded-xl bg-st-gold/5 px-4 py-2.5 text-[13px]">
          <span className="font-semibold text-st-gold-hover">
            {new Date(selectedSlot.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} de {selectedSlot.time_slot}
          </span>
        </div>
      )}
    </div>
  );
}
