import Link from "next/link";
import { ChefHat, Mail, Globe, Phone } from "lucide-react";

const footerNav = {
  boutique: [
    { label: "Tous les produits", href: "/boutique" },
    { label: "Kits de cuisine", href: "/boutique/kits" },
    { label: "Sauces & condiments", href: "/boutique/sauces" },
    { label: "Épices & herbes", href: "/boutique/epices" },
  ],
  services: [
    { label: "Prestation chef", href: "/prestation-chef" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ],
  compte: [
    { label: "Connexion", href: "/connexion" },
    { label: "Créer un compte", href: "/inscription" },
    { label: "Mes commandes", href: "/compte/commandes" },
    { label: "Mon profil", href: "/compte/profil" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      {/* ── top ────────────────────────────────────────────── */}
      <div className="bg-[var(--background)] py-16">
        <div className="st-section">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
            {/* brand column */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-st-gold text-black">
                  <ChefHat className="h-5 w-5" />
                </span>
                <span className="font-serif items-center text-xl font-bold tracking-tight">
                  Saveurs<span className="text-st-gold">Thaï</span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--st-warm-gray)]">
                Épicerie thaïlandaise artisanale et prestation chef à domicile.
                Des saveurs authentiques directement de Bangkok à votre table
                parisienne.
              </p>
              <div className="mt-6 flex gap-3">
                {[Globe, Phone, Mail].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--st-warm-gray)] transition-all hover:border-st-gold/30 hover:text-st-gold"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* nav columns */}
            {(
              [
                ["Boutique", footerNav.boutique],
                ["Services", footerNav.services],
                ["Compte", footerNav.compte],
              ] as const
            ).map(([title, links]) => (
              <div key={title} className="lg:col-span-2 lg:col-start-auto">
                <h4 className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-[var(--st-warm-gray)]">
                  {title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-[13px] text-[var(--foreground)]/70 transition-colors hover:text-st-gold"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── bottom ─────────────────────────────────────────── */}
      <div className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="st-section flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
          <p className="text-xs text-[var(--st-warm-gray)]">
            &copy; {new Date().getFullYear()} Saveurs Thaï &mdash; Tous droits
            réservés.
          </p>
          <div className="flex gap-6 text-xs text-[var(--st-warm-gray)]">
            <Link href="/mentions-legales" className="hover:text-st-gold transition-colors">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-st-gold transition-colors">
              CGV
            </Link>
            <Link href="/mentions-legales" className="hover:text-st-gold transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
