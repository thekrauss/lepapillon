import type { Metadata } from "next";
import RegisterForm from "@/components/shop/RegisterForm";

export const metadata: Metadata = {
  title: "Inscription — Saveurs Thai",
  description: "Creez votre compte Saveurs Thai pour commander et reserver votre cheffe a domicile.",
};

export default function InscriptionPage() {
  return <RegisterForm />;
}
