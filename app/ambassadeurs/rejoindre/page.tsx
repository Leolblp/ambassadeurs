"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useState } from "react";
import { demanderAcces, type EtatDemande } from "./actions";
import { createClient } from "@/lib/supabase/client";

export default function Rejoindre() {
  return (
    <Suspense>
      <Formulaire />
    </Suspense>
  );
}

function Formulaire() {
  const [resultat, envoyer, envoi] = useActionState<EtatDemande, FormData>(demanderAcces, null);
  const etat = resultat?.ok ? "ok" : "form";
  const codeTeam = useSearchParams().get("team")?.toUpperCase() ?? null;
  const [nomTeam, setNomTeam] = useState<string | null>(null);

  useEffect(() => {
    if (!codeTeam) return;
    createClient().rpc("team_name_from_code", { p_code: codeTeam }).then(({ data }) => setNomTeam((data as string | null) ?? null));
  }, [codeTeam]);

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
          <p style={{ margin: 0, color: "var(--gris)", lineHeight: 1.55 }}>Chaque demande est étudiée personnellement. Si ta candidature est retenue, tu recevras ton accès sur WhatsApp sous 72 h.</p>
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

          <form action={envoyer} style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 24 }}>
            {nomTeam && codeTeam && <input type="hidden" name="team" value={codeTeam} />}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <div><label className="champ-label" htmlFor="prenom">Prénom</label><input className="champ" id="prenom" name="prenom" required autoComplete="given-name" /></div>
              <div><label className="champ-label" htmlFor="nom">Nom</label><input className="champ" id="nom" name="nom" required autoComplete="family-name" /></div>
            </div>
            <div><label className="champ-label" htmlFor="insta">Instagram</label><input className="champ" id="insta" name="insta" placeholder="@toncompte" required autoCapitalize="none" autoCorrect="off" spellCheck={false} /></div>
            <div><label className="champ-label" htmlFor="tel">Téléphone (WhatsApp)</label><input className="champ" id="tel" name="tel" type="tel" autoComplete="tel" required placeholder="06 12 34 56 78" /></div>
            <div><label className="champ-label" htmlFor="why">Pourquoi toi ?</label><textarea className="champ" id="why" name="why" rows={3} placeholder="Ton univers, ta team, ce que tu apporterais au club." style={{ resize: "vertical" }} /></div>

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, color: "var(--gris)", cursor: "pointer" }}>
              <input type="checkbox" name="cgu" required style={{ marginTop: 1, accentColor: "var(--rouge)" }} />
              <span>J&apos;ai 18 ans ou plus. Les messages du club (accès, missions, points) m&apos;arrivent sur WhatsApp. J&apos;accepte la <Link href="/ambassadeurs/confidentialite" target="_blank" style={{ color: "var(--encre)" }}>politique de confidentialité</Link> et les <Link href="/ambassadeurs/mentions-legales" target="_blank" style={{ color: "var(--encre)" }}>conditions du club</Link>.</span>
            </label>

            {resultat && !resultat.ok && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>{resultat.message}</p>}

            <button className="btn" type="submit" disabled={envoi} style={{ width: "100%", marginTop: 8 }}>
              {envoi ? "Envoi…" : "Envoyer ma demande"}
            </button>
            <p style={{ margin: 0, textAlign: "center", fontSize: 12, color: "var(--gris)" }}>Réponse sous 72 h · places limitées · <Link href="/ambassadeurs/faq" style={{ color: "var(--gris)" }}>Questions fréquentes</Link></p>
          </form>
        </>
      )}
    </div>
  );
}
