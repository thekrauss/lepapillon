import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/shop/LoginForm";

export const metadata: Metadata = {
  title: "Connexion — Saveurs Thai",
};

export default function ConnexionPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
