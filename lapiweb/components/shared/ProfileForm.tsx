"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { useProfile, useUpdateProfile, useChangePassword } from "@/hooks/useAuth";

export default function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ first_name: firstName, last_name: lastName, phone });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return;
    if (newPassword !== confirmPassword) return;
    changePassword.mutate(newPassword, {
      onSuccess: () => { setNewPassword(""); setConfirmPassword(""); },
    });
  };

  const passwordMatch = newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Informations personnelles ─────────────────── */}
      <form onSubmit={handleProfileSubmit} className="space-y-5">
        <h3 className="text-[14px] font-bold">Informations personnelles</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Prenom</label>
            <input
              type="text"
              className="st-input w-full"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Nom</label>
            <input
              type="text"
              className="st-input w-full"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Email</label>
          <input
            type="email"
            className="st-input w-full bg-[var(--muted)]/50"
            value={email}
            disabled
          />
          <p className="mt-1 text-[11px] text-[var(--st-warm-gray)]">L&apos;email ne peut pas etre modifie</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Telephone</label>
          <input
            type="tel"
            className="st-input w-full"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
          />
        </div>
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="st-btn-primary py-3 sm:w-auto sm:px-8 disabled:opacity-50"
        >
          {updateProfile.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
          ) : (
            "Enregistrer"
          )}
        </button>
      </form>

      <div className="border-t border-[var(--border)]" />

      {/* ── Changement de mot de passe ────────────────── */}
      <form onSubmit={handlePasswordSubmit} className="space-y-5">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-bold">
            <Lock className="h-4 w-4 text-st-gold" />
            Changer le mot de passe
          </h3>
          <p className="mt-1 text-[12px] text-[var(--st-warm-gray)]">Minimum 8 caracteres</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="st-input w-full pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--st-warm-gray)] hover:text-[var(--foreground)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword && !passwordValid && (
            <p className="mt-1 text-[11px] text-red-500">8 caracteres minimum</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold">Confirmer le mot de passe</label>
          <input
            type={showPassword ? "text" : "password"}
            className="st-input w-full"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmer le mot de passe"
          />
          {confirmPassword && !passwordMatch && (
            <p className="mt-1 text-[11px] text-red-500">Les mots de passe ne correspondent pas</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!passwordValid || !passwordMatch || !newPassword || changePassword.isPending}
          className="st-btn-primary py-3 sm:w-auto sm:px-8 disabled:opacity-50"
        >
          {changePassword.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Modification...</>
          ) : (
            "Changer le mot de passe"
          )}
        </button>
      </form>
    </div>
  );
}
