"use client";

import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.nexusTheme = localStorage.getItem("nexus-theme") || "vermelho";
  }, []);
  return <>{children}</>;
}
