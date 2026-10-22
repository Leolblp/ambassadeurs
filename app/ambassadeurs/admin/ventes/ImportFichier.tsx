"use client";

import { useActionState } from "react";
import type { Resultat } from "../actions";

export default function ImportFichier({ action }: { action: (prev: Resultat, f: FormData) => Promise<Resultat> }) {
  const [res, formAction, enCours] = useActionState(action, null);
  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input className="champ" type="file" name="fichier" accept=".csv,.xlsx,.xls" required />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button className="btn" type="submit" disabled={enCours} style={{ minHeight: 46 }}>{enCours ? "Import en cours…" : "Importer les ventes"}</button>
      </div>
      {res && <p role="status" style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: res.ok ? "var(--vert)" : "var(--rouge)" }}>{res.message}</p>}
    </form>
  );
}
