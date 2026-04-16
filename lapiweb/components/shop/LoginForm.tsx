"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";
import AuthLayout from "@/components/shared/AuthLayout";
import SocialButtons from "@/components/shared/SocialButtons";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password }, {
      onSuccess: (data) => {
        const redirect = searchParams.get("redirect");
        if (redirect) {
          router.push(redirect);
        } else if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/boutique");
        }
      },
    });
  };

  return (
    <AuthLayout>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-xl shadow-black/[0.03]">
        <div className="p-8">
          <h1 className="text-center font-serif text-2xl font-bold">Bon retour !</h1>
          <p className="mt-1.5 text-center text-[13px] text-[var(--st-warm-gray)]">
            Connectez-vous pour commander et suivre vos commandes.
          </p>

          {/* Social buttons */}
          <SocialButtons label="se connecter avec" />

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
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center justify-between text-[13px] font-semibold">
                Mot de passe
                <Link href="/mot-de-passe-oublie" className="font-medium text-st-gold transition-colors hover:text-st-gold-hover">
                  Oublie ?
                </Link>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="st-input w-full pl-10 pr-10"
                  placeholder="Votre mot de passe"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--st-warm-gray)] transition-colors hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={login.isPending || !email || !password}
              className="st-btn-primary w-full gap-2 py-3.5 disabled:opacity-50"
            >
              {login.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connexion...</>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-8 py-4">
          <p className="text-center text-[13px] text-[var(--st-warm-gray)]">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-semibold text-st-gold transition-colors hover:text-st-gold-hover">
              Creer un compte
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
