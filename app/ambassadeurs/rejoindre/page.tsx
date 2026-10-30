"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Rejoindre() {
  return (
    <Suspense>
      <Formulaire />
    </Suspense>
  );
}

function Formulaire() {
  const [etat, setEtat] = useState<"form" | "envoi" | "ok" | "erreur">("form");
  const codeTeam = useSearchParams().get("team")?.toUpperCase() ?? null;
  const [nomTeam, setNomTeam] = useState<string | null>(null);

  useEffect(() => {
    if (!codeTeam) return;
    createClient().rpc("team_name_from_code", { p_code: codeTeam }).then(({ data }) => setNomTeam((data as string | null) ?? null));
  }, [codeTeam]);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEtat("envoi");
    const { error } = await createClient().from("access_requests").insert({
      first_name: String(f.get("prenom") || "").trim(),
      last_name: String(f.get("nom") || "").trim(),
      email: String(f.get("email") || "").trim().toLowerCase(),
      phone: String(f.get("tel") || "").trim() || null,
      whatsapp_optin: f.get("whatsapp") === "on",
      instagram: String(f.get("insta") || "").trim() || null,
      motivation: String(f.get("why") || "").trim() || null,
      team_code: nomTeam ? codeTeam : null,
    });
    setEtat(error ? "erreur" : "ok");
  }

  return (
    <div className="ecran">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" aria-label="Retour" style={{ display: "inline-flex", width: 44, height: 44, alignItems: "center", justifyContent: "center", border: "1px solid var(--bord)", borderRadius: "50%" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        </Link>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={72} height={43} />
        <div style={{ width: 44 }} />
      </div>

      {etat === "ok" ? (
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, textAlign: "center" }}>
          <p className="label" style={{ margin: 0 }}>Demande reçue</p>
          <h1 className="serif" style={{ margin: 0, fontSize: 40, lineHeight: 1.05 }}>Merci. On revient vers toi.</h1>
          <p style={{ margin: 0, color: "var(--gris)", lineHeight: 1.55 }}>Chaque demande est étudiée personnellement. Si ta candidature est retenue, tu recevras ton accès sur WhatsApp (ou par email) sous 72 h.</p>
        </div>
      ) : (
        <>
          <div style={{ padding: "28px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
            <p className="label" style={{ margin: 0 }}>Demande d&apos;accès</p>
            <h1 className="serif" style={{ margin: 0, fontSize: 36, lineHeight: 1.05 }}>Le club ne s&apos;ouvre pas à tout le monde.</h1>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--gris)" }}>Présente-toi. Chaque demande est étudiée personnellement par l&apos;équipe.</p>
            {nomTeam && (
              <p style={{ margin: "6px 0 0", padding: "10px 14px", border: "1px dashed var(--bord-rouge)", borderRadius: 12, fontSize: 13 }}>
                Recommandé par la team <b>{nomTeam}</b>
              </p>
            )}
          </div>

          <form onSubmit={envoyer} style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <div><label className="champ-label" htmlFor="prenom">Prénom</label><input className="champ" id="prenom" name="prenom" required autoComplete="given-name" /></div>
              <div><label className="champ-label" htmlFor="nom">Nom</label><input className="champ" id="nom" name="nom" required autoComplete="family-name" /></div>
            </div>
            <div><label className="champ-label" htmlFor="insta">Instagram</label><input className="champ" id="insta" name="insta" placeholder="@toncompte" required autoCapitalize="none" autoCorrect="off" spellCheck={false} /></div>
            <div><label className="champ-label" htmlFor="email">Email</label><input className="champ" id="email" name="email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} /></div>
            <div><label className="champ-label" htmlFor="tel">Téléphone (WhatsApp)</label><input className="champ" id="tel" name="tel" type="tel" autoComplete="tel" required placeholder="06 12 34 56 78" /></div>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, color: "var(--gris)", cursor: "pointer" }}>
              <input type="checkbox" name="whatsapp" style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--rouge)", flex: "none" }} />
              <span>J&apos;accepte de recevoir sur WhatsApp les messages du XOXO Club (missions, points, privilèges). Désactivable à tout moment depuis ma carte.</span>
            </label>
            <div><label className="champ-label" htmlFor="why">Pourquoi toi ?</label><textarea className="champ" id="why" name="why" rows={3} placeholder="Ton univers, ta team, ce que tu apporterais au club." style={{ resize: "vertical" }} /></div>

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, color: "var(--gris)", cursor: "pointer" }}>
              <input type="checkbox" name="cgu" required style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--rouge)", flex: "none" }} />
              <span>J&apos;ai 18 ans ou plus et j&apos;accepte la <Link href="/ambassadeurs/confidentialite" target="_blank" style={{ color: "var(--encre)" }}>politique de confidentialité</Link> et les <Link href="/ambassadeurs/mentions-legales" target="_blank" style={{ color: "var(--encre)" }}>conditions du club</Link>.</span>
            </label>

            {etat === "erreur" && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>L&apos;envoi n&apos;a pas abouti. Réessaie dans un instant.</p>}

            <button className="btn" type="submit" disabled={etat === "envoi"} style={{ width: "100%", marginTop: 8 }}>
              {etat === "envoi" ? "Envoi…" : "Envoyer ma demande"}
            </button>
            <p style={{ margin: 0, textAlign: "center", fontSize: 12, color: "var(--gris)" }}>Réponse sous 72 h · places limitées · <Link href="/ambassadeurs/faq" style={{ color: "var(--gris)" }}>Questions fréquentes</Link></p>
          </form>
        </>
      )}
    </div>
  );
}
