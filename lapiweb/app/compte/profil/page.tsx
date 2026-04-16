"use client";

import { useState, useEffect } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useProfile, useUpdateProfile } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/useAuthStore";
import ProfileForm from "@/components/shared/ProfileForm";

export default function ProfilPage() {
  const { role } = useAuthStore();

  // Admin goes to /admin/profil
  if (role === "admin") {
    return (
      <AuthGuard>
        <Header />
        <main className="min-h-screen pt-20">
          <section className="py-10">
            <div className="st-section mx-auto max-w-xl">
              <Link href="/admin" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
                <ArrowLeft className="h-3.5 w-3.5" /> Administration
              </Link>
              <h1 className="st-heading">Mon profil</h1>
              <div className="mt-8">
                <ProfileForm />
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-10">
          <div className="st-section mx-auto max-w-xl">
            <Link href="/compte" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
              <ArrowLeft className="h-3.5 w-3.5" /> Mon compte
            </Link>
            <h1 className="st-heading">Mes informations</h1>
            <div className="mt-8">
              <ProfileForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AuthGuard>
  );
}
