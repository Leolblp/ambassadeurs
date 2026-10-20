"use client";

import { useActionState } from "react";
import { reglerWhatsApp } from "./actions";

export default function ReglageWhatsApp({ tel, optin }: { tel: string | null; optin: boolean }) {
  const [etat, action, envoi] = useActionState(reglerWhatsApp, null);
  return (
    <form action={action} className="carte" style={{ borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 className="label" style={{ margin: 0 }}>Notifications WhatsApp</h2>
      <label className="champ-label" htmlFor="tel-wa" style={{ margin: 0 }}>Mon numéro</label>
      <input className="champ" id="tel-wa" name="tel" type="tel" defaultValue={tel ?? ""} placeholder="06 12 34 56 78" autoComplete="tel" />
      <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, cursor: "pointer" }}>
        <input type="checkbox" name="whatsapp" defaultChecked={optin} style={{ width: 18, height: 18, accentColor: "var(--rouge)" }} />
        Recevoir missions, points et privilèges sur WhatsApp
      </label>
      <button className="btn" type="submit" disabled={envoi} style={{ minHeight: 44 }}>{envoi ? "Enregistrement…" : "Enregistrer"}</button>
      {etat && <p role="status" style={{ margin: 0, fontSize: 13, color: etat.ok ? "var(--vert)" : "var(--rouge)" }}>{etat.message}</p>}
    </form>
  );
}
