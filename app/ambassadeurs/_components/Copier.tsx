"use client";

import { useState } from "react";

/** Copie ou partage le code membre (partage natif sur mobile). */
export default function Copier({ code, partage = false }: { code: string; partage?: boolean }) {
  const [ok, setOk] = useState(false);

  async function action() {
    const texte = `Mon code XOXO pour La Commerciale : ${code}`;
    try {
      if (partage && navigator.share) {
        await navigator.share({ text: texte });
        return;
      }
      await navigator.clipboard.writeText(code);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch {
      /* partage annulé */
    }
  }

  return (
    <button
      type="button"
      onClick={action}
      style={{
        minHeight: 44, padding: "0 16px", background: "transparent", color: "var(--encre)",
        border: "1px solid var(--bord)", borderRadius: 999, cursor: "pointer",
        font: "700 12px var(--font-body), system-ui, sans-serif", letterSpacing: ".12em", textTransform: "uppercase",
      }}
    >
      {ok ? "Copié" : partage ? "Partager" : "Copier"}
    </button>
  );
}
