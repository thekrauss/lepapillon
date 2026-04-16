"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone, Check } from "lucide-react";
import { useRegister } from "@/hooks/useAuth";
import AuthLayout from "@/components/shared/AuthLayout";
import SocialButtons from "@/components/shared/SocialButtons";

export default function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const passwordMatch = form.password === form.confirmPassword;
  const passwordStrong = form.password.length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordMatch || !passwordStrong) return;

    register.mutate({
      email: form.email,
      password: form.password,
      full_name: form.fullName,
      phone_number: form.phone,
    }, {
      onSuccess: () => setSuccess(true),
    });
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card p-8 text-center shadow-xl shadow-black/[0.03]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-st-forest/10">
            <Check className="h-8 w-8 text-st-forest" />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-bold">Compte cree !</h1>
          <p className="mt-2 text-[14px] text-[var(--st-warm-gray)]">
            Un email de verification a ete envoye a <strong className="text-[var(--foreground)]">{form.email}</strong>.
            Verifiez votre boite de reception puis connectez-vous.
          </p>
          <Link href="/connexion" className="st-btn-primary mt-6 inline-flex gap-2">
            Se connecter
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-xl shadow-black/[0.03]">
        <div className="p-8">
          <h1 className="text-center font-serif text-2xl font-bold">Creer un compte</h1>
          <p className="mt-1.5 text-center text-[13px] text-[var(--st-warm-gray)]">
            Rejoignez Saveurs Thai pour commander et reserver votre cheffe.
          </p>

          {/* Social buttons */}
          <SocialButtons label="s'inscrire avec" />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-[var(--st-warm-gray)]">ou par email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={update("fullName")}
                  className="st-input w-full pl-10"
                  placeholder="Prenom Nom"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  className="st-input w-full pl-10"
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Telephone <span className="font-normal text-[var(--st-warm-gray)]">(optionnel)</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  className="st-input w-full pl-10"
                  placeholder="06 12 34 56 78"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  className="st-input w-full pl-10 pr-10"
                  placeholder="Min. 8 caracteres"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--st-warm-gray)] transition-colors hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full ${form.password.length >= 8 ? "bg-st-forest" : form.password.length >= 4 ? "bg-st-gold" : "bg-red-400"}`} />
                  <span className="text-[11px] text-[var(--st-warm-gray)]">
                    {form.password.length >= 8 ? "Fort" : form.password.length >= 4 ? "Moyen" : "Faible"}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Confirmer</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  className={`st-input w-full pl-10 ${form.confirmPassword && !passwordMatch ? "border-red-400 focus:border-red-400" : ""}`}
                  placeholder="Confirmez le mot de passe"
                  required
                  autoComplete="new-password"
                />
                {form.confirmPassword && passwordMatch && (
                  <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-st-forest" />
                )}
              </div>
              {form.confirmPassword && !passwordMatch && (
                <p className="mt-1 text-[11px] text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={register.isPending || !passwordMatch || !passwordStrong || !form.fullName || !form.email}
              className="st-btn-primary w-full gap-2 py-3.5 disabled:opacity-50"
            >
              {register.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creation...</>
              ) : (
                "Creer mon compte"
              )}
            </button>

            <p className="text-center text-[11px] text-[var(--st-warm-gray)]">
              En creant un compte, vous acceptez nos{" "}
              <Link href="/cgv" className="text-st-gold hover:underline">CGV</Link> et notre{" "}
              <Link href="/mentions-legales" className="text-st-gold hover:underline">politique de confidentialite</Link>.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-8 py-4">
          <p className="text-center text-[13px] text-[var(--st-warm-gray)]">
            Deja un compte ?{" "}
            <Link href="/connexion" className="font-semibold text-st-gold transition-colors hover:text-st-gold-hover">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
