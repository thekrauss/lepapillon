"use client";

const items = [
  "100% Authentique",
  "Ingrédients importés de Thaïlande",
  "Livraison Paris & IDF sous 24h",
  "Recettes familiales depuis 3 générations",
  "Cheffe à domicile disponible 7j/7",
  "Paiement 100% sécurisé",
  "Kits prêts en 30 minutes",
  "Saveurs d'exception",
];

const doubled = [...items, ...items];

export default function MarqueeStrip() {
  return (
    <div className="overflow-hidden border-y border-st-gold/20 bg-st-gold py-3">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 px-8 text-[11.5px] font-bold uppercase tracking-[0.16em] text-white"
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-white/50" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
