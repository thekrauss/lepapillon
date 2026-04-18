"use client";
import { ReactNode } from "react";

interface AuroraWrapperProps {
  children: ReactNode;
}

export default function AuroraWrapper({ children }: AuroraWrapperProps) {
  return (
    <div className="min-h-screen bg-transparent font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col relative overflow-hidden">
      {children}
    </div>
  );
}