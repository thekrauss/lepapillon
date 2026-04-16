import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/shop/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublie — Saveurs Thai",
};

export default function MotDePasseOubliePage() {
  return <ForgotPasswordForm />;
}
