"use client";

import ProfileForm from "@/components/shared/ProfileForm";

export default function AdminProfilPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-bold">Mon profil</h1>
        <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">Modifier vos informations personnelles.</p>
      </div>
      <div className="st-card">
        <ProfileForm />
      </div>
    </div>
  );
}
