"use client";

import { useCategories } from "@/hooks/useCatalogue";
import { Loader2 } from "lucide-react";

interface Props {
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export default function CategoryTabs({ activeSlug, onSelect }: Props) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-[var(--muted)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
          activeSlug === null
            ? "bg-st-gold text-white shadow-md shadow-st-gold/20"
            : "border border-[var(--border)] text-[var(--foreground)]/70 hover:border-st-gold/30 hover:text-st-gold"
        }`}
      >
        Tous
      </button>
      {categories?.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
            activeSlug === cat.slug
              ? "bg-st-gold text-white shadow-md shadow-st-gold/20"
              : "border border-[var(--border)] text-[var(--foreground)]/70 hover:border-st-gold/30 hover:text-st-gold"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
