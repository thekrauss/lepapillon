"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, Check } from "lucide-react";
import { useForgotPassword } from "@/hooks/useAuth";
import AuthLayout from "@/components/shared/AuthLayout";

export default function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(email, {
      onSuccess: () => setSent(true),
    });
  };

  return (
    <AuthLayout>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-xl shadow-black/[0.03]">
        <div className="p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-st-forest/10">
                <Check className="h-7 w-7 text-st-forest" />
              </div>
              <h1 className="mt-5 font-serif text-xl font-bold">Email envoye !</h1>
              <p className="mt-2 text-[14px] text-[var(--st-warm-gray)]">
                Si un compte existe avec <strong className="text-[var(--foreground)]">{email}</strong>,
                vous recevrez un lien de reinitialisation.
              </p>
              <p className="mt-4 text-[13px] text-[var(--st-warm-gray)]">
                Verifiez aussi vos spams.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link href="/connexion" className="st-btn-primary w-full py-3.5">
                  Retour a la connexion
                </Link>
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="text-[13px] font-medium text-[var(--st-warm-gray)] transition hover:text-st-gold"
                >
                  Essayer un autre email
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-center font-serif text-xl font-bold">Mot de passe oublie</h1>
              <p className="mt-1.5 text-center text-[13px] text-[var(--st-warm-gray)]">
                Entrez votre email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="st-input w-full pl-10"
                      placeholder="votre@email.com"
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgot.isPending || !email}
                  className="st-btn-primary w-full gap-2 py-3.5 disabled:opacity-50"
                >
                  {forgot.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</>
                  ) : (
                    "Envoyer le lien"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-8 py-4">
          <Link
            href="/connexion"
            className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] transition hover:text-st-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour a la connexion
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
