"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Connexion() {
  const [etat, setEtat] = useState<"form" | "envoi" | "ok" | "erreur">("form");

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim().toLowerCase();
    setEtat("envoi");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/ambassadeurs/auth/callback`,
      },
    });
    setEtat(error ? "erreur" : "ok");
  }

  return (
    <div className="ecran" style={{ justifyContent: "space-between" }}>
      <Link href="/" style={{ alignSelf: "center" }}>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={120} height={71} />
      </Link>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="label" style={{ margin: 0 }}>Espace membre</p>
        <h1 className="serif" style={{ margin: 0, fontSize: 40, lineHeight: 1.05 }}>
          {etat === "ok" ? "Vérifie ta boîte mail." : "Bon retour parmi nous."}
        </h1>
        <p style={{ margin: 0, color: "var(--gris)", lineHeight: 1.55 }}>
          {etat === "ok"
            ? "Si ton adresse est celle d'un membre, tu viens de recevoir ton lien d'accès. Il est valable une heure."
            : "Entre l'adresse de ton accès membre. On t'envoie un lien de connexion, sans mot de passe."}
        </p>
      </div>

      {etat !== "ok" ? (
        <form onSubmit={envoyer} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label className="champ-label" htmlFor="email">Email</label><input className="champ" id="email" name="email" type="email" required autoComplete="email" /></div>
          {etat === "erreur" && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>Cette adresse n&apos;a pas d&apos;accès membre, ou l&apos;envoi a échoué.</p>}
          <button className="btn" type="submit" disabled={etat === "envoi"} style={{ width: "100%" }}>
            {etat === "envoi" ? "Envoi…" : "Recevoir mon lien"}
          </button>
          <Link href="/ambassadeurs/rejoindre" style={{ textAlign: "center", fontSize: 14, color: "var(--gris)" }}>Pas encore membre ? Demander mon accès</Link>
        </form>
      ) : (
        <button className="btn" type="button" onClick={() => setEtat("form")} style={{ width: "100%", background: "transparent", color: "var(--encre)", border: "1px solid var(--bord)" }}>
          Utiliser une autre adresse
        </button>
      )}
    </div>
  );
}
