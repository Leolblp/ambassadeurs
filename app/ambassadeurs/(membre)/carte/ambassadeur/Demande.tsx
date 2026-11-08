"use client";

import { useActionState } from "react";
import { demanderAmbassadeur } from "../actions";

export default function Demande() {
  const [etat, action, envoi] = useActionState(demanderAmbassadeur, null);
  if (etat?.ok) return <p role="status" className="carte" style={{ margin: 0, padding: 16, borderRadius: 14, fontSize: 15 }}>{etat.message}</p>;
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><label className="champ-label" htmlFor="insta">Instagram</label><input className="champ" id="insta" name="insta" placeholder="@toncompte" required autoCapitalize="none" autoCorrect="off" spellCheck={false} /></div>
      <div><label className="champ-label" htmlFor="why">Pourquoi toi ?</label><textarea className="champ" id="why" name="why" rows={3} placeholder="Ton univers, ton réseau, ce que tu apporterais." style={{ resize: "vertical" }} /></div>
      {etat && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>{etat.message}</p>}
      <button className="btn" type="submit" disabled={envoi} style={{ width: "100%" }}>{envoi ? "Envoi…" : "Demander à devenir ambassadeur"}</button>
    </form>
  );
}
