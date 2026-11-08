"use client";

import { useActionState } from "react";
import { enregistrerNaissance } from "./actions";

export default function Naissance() {
  const [etat, action, envoi] = useActionState(enregistrerNaissance, null);
  if (etat?.ok) return null;
  return (
    <form action={action} className="carte" style={{ borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10, border: "1px dashed var(--bord-rouge)" }}>
      <h2 className="label" style={{ margin: 0 }}>Ta surprise d&apos;anniversaire</h2>
      <p style={{ margin: 0, fontSize: 13, color: "var(--gris)" }}>Indique ta date de naissance pour la débloquer. Elle ne pourra plus être modifiée.</p>
      <label className="champ-label" htmlFor="naissance-carte" style={{ margin: 0 }}>Date de naissance</label>
      <input className="champ" id="naissance-carte" name="naissance" type="date" required autoComplete="bday" />
      <button className="btn" type="submit" disabled={envoi} style={{ minHeight: 44 }}>{envoi ? "Enregistrement…" : "Enregistrer"}</button>
      {etat && <p role="status" style={{ margin: 0, fontSize: 13, color: "var(--rouge)" }}>{etat.message}</p>}
    </form>
  );
}
