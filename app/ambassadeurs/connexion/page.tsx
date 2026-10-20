"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { demanderCode, verifierCode, type EtatCode } from "./actions";

export default function Connexion() {
  const [mode, setMode] = useState<"whatsapp" | "email">("whatsapp");
  return (
    <div className="ecran" style={{ justifyContent: "space-between" }}>
      <Link href="/" style={{ alignSelf: "center" }}>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={120} height={71} />
      </Link>
      {mode === "whatsapp" ? <ParWhatsApp versEmail={() => setMode("email")} /> : <ParEmail versWhatsApp={() => setMode("whatsapp")} />}
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

const lienDiscret: React.CSSProperties = { background: "none", border: 0, color: "var(--gris)", fontSize: 14, cursor: "pointer", textDecoration: "underline", padding: 8 };

function ParWhatsApp({ versEmail }: { versEmail: () => void }) {
  const [etatTel, actionTel, envoiTel] = useActionState<EtatCode, FormData>(demanderCode, null);
  const [etatCode, actionCode, envoiCode] = useActionState<EtatCode, FormData>(verifierCode, null);
  const [retour, setRetour] = useState(false);
  const etape = !retour && etatTel?.etape === "code" ? "code" : "tel";
  const tel = etatTel?.tel ?? "";

  if (etape === "code") {
    return (
      <>
        <Titre titre="Ton code arrive." texte="Si ce numéro est celui d'un membre, tu viens de recevoir un code à 6 chiffres sur WhatsApp." />
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
        <button type="button" onClick={versEmail} style={lienDiscret}>Recevoir plutôt un lien par email</button>
        <Link href="/ambassadeurs/rejoindre" style={{ textAlign: "center", fontSize: 14, color: "var(--gris)" }}>Pas encore membre ? Demander mon accès</Link>
      </form>
    </>
  );
}

function ParEmail({ versWhatsApp }: { versWhatsApp: () => void }) {
  const [etat, setEtat] = useState<"form" | "envoi" | "ok" | "erreur">("form");

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim().toLowerCase();
    setEtat("envoi");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/ambassadeurs/auth/callback` },
    });
    setEtat(error ? "erreur" : "ok");
  }

  return (
    <>
      <Titre
        titre={etat === "ok" ? "Vérifie ta boîte mail." : "Connexion par email."}
        texte={etat === "ok" ? "Si ton adresse est celle d'un membre, tu viens de recevoir ton lien d'accès. Pense à regarder dans tes spams." : "Entre l'adresse de ton accès membre. On t'envoie un lien de connexion."}
      />
      {etat !== "ok" ? (
        <form onSubmit={envoyer} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label className="champ-label" htmlFor="email">Email</label><input className="champ" id="email" name="email" type="email" required autoComplete="email" /></div>
          {etat === "erreur" && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>Cette adresse n&apos;a pas d&apos;accès membre, ou l&apos;envoi a échoué.</p>}
          <button className="btn" type="submit" disabled={etat === "envoi"} style={{ width: "100%" }}>{etat === "envoi" ? "Envoi…" : "Recevoir mon lien"}</button>
          <button type="button" onClick={versWhatsApp} style={lienDiscret}>Recevoir plutôt un code sur WhatsApp</button>
        </form>
      ) : (
        <button className="btn" type="button" onClick={() => setEtat("form")} style={{ width: "100%", background: "transparent", color: "var(--encre)", border: "1px solid var(--bord)" }}>
          Utiliser une autre adresse
        </button>
      )}
    </>
  );
}
