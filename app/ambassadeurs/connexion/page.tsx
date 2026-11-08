"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { demanderCode, verifierCode, type EtatCode } from "./actions";

export default function Connexion() {
  return (
    <div className="ecran" style={{ justifyContent: "space-between" }}>
      <Link href="/" style={{ alignSelf: "center" }}>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={120} height={71} />
      </Link>
      <ParWhatsApp />
    </div>
  );
}

function Titre({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p className="label" style={{ margin: 0 }}>Espace membre</p>
      <h1 className="serif" style={{ margin: 0, fontSize: 40, lineHeight: 1.05 }}>{titre}</h1>
      <p style={{ margin: 0, color: "var(--gris)", lineHeight: 1.55 }}>{texte}</p>
    </div>
  );
}

const lienDiscret: React.CSSProperties = { background: "none", border: 0, color: "var(--gris)", fontSize: 14, cursor: "pointer", textDecoration: "underline", padding: "0 8px", minHeight: 44 };

function ParWhatsApp() {
  const [etatTel, actionTel, envoiTel] = useActionState<EtatCode, FormData>(demanderCode, null);
  const [etatCode, actionCode, envoiCode] = useActionState<EtatCode, FormData>(verifierCode, null);
  const [retour, setRetour] = useState(false);
  const etape = !retour && etatTel?.etape === "code" ? "code" : "tel";
  const tel = etatTel?.tel ?? "";

  if (etape === "code") {
    return (
      <>
        <Titre titre="Ton code arrive." texte="Si ce numéro est celui d'un membre, tu viens de recevoir un code à 6 chiffres sur WhatsApp (ou par SMS si WhatsApp ne passe pas)." />
        <form action={actionCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="hidden" name="tel" value={tel} />
          <div>
            <label className="champ-label" htmlFor="code">Code reçu sur WhatsApp</label>
            <input className="champ" id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={10} required autoFocus
              style={{ fontSize: 24, letterSpacing: ".3em", textAlign: "center" }} />
          </div>
          {etatCode?.erreur && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>{etatCode.erreur}</p>}
          <button className="btn" type="submit" disabled={envoiCode} style={{ width: "100%" }}>{envoiCode ? "Vérification…" : "Entrer au club"}</button>
          <button type="button" onClick={() => setRetour(true)} style={lienDiscret}>Changer de numéro ou renvoyer un code</button>
        </form>
      </>
    );
  }

  return (
    <>
      <Titre titre="Bon retour parmi nous." texte="Entre ton numéro : on t'envoie un code de connexion sur WhatsApp. Pas de mot de passe." />
      <form action={(f) => { setRetour(false); actionTel(f); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label className="champ-label" htmlFor="tel">Numéro WhatsApp</label><input className="champ" id="tel" name="tel" type="tel" autoComplete="tel" required placeholder="06 12 34 56 78" defaultValue={tel} /></div>
        {etatTel?.erreur && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>{etatTel.erreur}</p>}
        <button className="btn" type="submit" disabled={envoiTel} style={{ width: "100%" }}>{envoiTel ? "Envoi…" : "Recevoir mon code"}</button>
        <Link href="/carte" style={{ textAlign: "center", fontSize: 14, color: "var(--gris)" }}>Pas encore de carte ? Prendre ma carte</Link>
      </form>
    </>
  );
}
