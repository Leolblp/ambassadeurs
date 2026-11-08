"use client";

import { useActionState } from "react";
import { reglerWhatsApp } from "./actions";

export default function ReglageWhatsApp({ tel, optin, fidelite = false }: { tel: string | null; optin: boolean; fidelite?: boolean }) {
  const [etat, action, envoi] = useActionState(reglerWhatsApp, null);
  return (
    <form action={action} className="carte" style={{ borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 className="label" style={{ margin: 0 }}>Notifications WhatsApp</h2>
      <p style={{ margin: 0, fontSize: 14 }}>Mon numéro : <b>{tel ?? "aucun"}</b></p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--gris)" }}>Il sert à te connecter. Pour le changer, écris à l&apos;équipe sur Instagram.</p>
      <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, cursor: "pointer" }}>
        <input type="checkbox" name="whatsapp" defaultChecked={optin} style={{ accentColor: "var(--rouge)" }} />
        {fidelite ? "Recevoir les infos et soirées de La Commerciale sur WhatsApp" : "Recevoir missions, points et privilèges sur WhatsApp"}
      </label>
      <button className="btn" type="submit" disabled={envoi} style={{ minHeight: 44 }}>{envoi ? "Enregistrement…" : "Enregistrer"}</button>
      {etat && <p role="status" style={{ margin: 0, fontSize: 13, color: etat.ok ? "var(--vert)" : "var(--rouge)" }}>{etat.message}</p>}
    </form>
  );
}
