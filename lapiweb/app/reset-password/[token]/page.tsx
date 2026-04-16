import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat } from "lucide-react";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — Saveurs Thaï",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[var(--st-cream)] to-white px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-st-gold text-white">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="font-serif text-2xl font-bold tracking-tight">
            Saveurs<span className="text-st-gold">Thaï</span>
          </span>
        </Link>

        <div className="st-card">
          <h1 className="text-center font-sans text-xl font-bold">Nouveau mot de passe</h1>
          <p className="mt-1 text-center text-[13px] text-[var(--st-warm-gray)]">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>

          <form className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Nouveau mot de passe</label>
              <input type="password" className="st-input w-full" placeholder="Min. 8 caractères" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Confirmer</label>
              <input type="password" className="st-input w-full" placeholder="Confirmez" />
            </div>
            <button type="submit" className="st-btn-primary w-full py-3.5">
              Réinitialiser
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
