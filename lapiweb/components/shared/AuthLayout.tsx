import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--st-cream)] via-white to-[#FFF7ED]" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-st-gold/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-st-forest/[0.03] blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-st-gold text-black shadow-lg shadow-st-gold/20">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="font-serif text-2xl font-bold tracking-tight">
            Saveurs<span className="text-st-gold">Thai</span>
          </span>
        </Link>

        {children}
      </div>
    </main>
  );
}
