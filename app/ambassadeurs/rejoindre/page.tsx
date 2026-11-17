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

  const formulaire = (
    <form action={envoyer} id="demande" className="rej-form" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 className="rej-h2">Demande d&apos;accès</h2>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: "var(--gris)" }}>Présente-toi. Chaque demande est lue par l&apos;équipe.</p>
      </div>
      {nomTeam && (
        <p style={{ margin: 0, padding: "10px 14px", border: "1px dashed var(--bord-rouge)", borderRadius: 12, fontSize: 14 }}>
          Recommandé par la team <b>{nomTeam}</b>
        </p>
      )}
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

      <button className="btn" type="submit" disabled={envoi} style={{ width: "100%", marginTop: 4 }}>
        {envoi ? "Envoi…" : "Envoyer ma demande"}
      </button>
      <p style={{ margin: 0, textAlign: "center", fontSize: 13, color: "var(--gris)" }}>Réponse sur WhatsApp sous 72 h</p>
    </form>
  );

  return (
    <div className="rej">
      <div className="rej-haut">
        <Link href="/" aria-label="Retour à l'accueil" style={{ display: "inline-flex", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--bord)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        </Link>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={72} height={43} priority />
        <Link href="/ambassadeurs/connexion" style={{ fontSize: 15, fontWeight: 600, textDecoration: "none" }}>Connexion</Link>
      </div>

      {etat === "ok" ? (
        <div style={{ minHeight: "70dvh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 14, textAlign: "center" }}>
          <p className="label" style={{ margin: 0 }}>Demande reçue</p>
          <h1 className="rej-titre" style={{ fontSize: "clamp(44px, 12vw, 72px)" }}>Merci.<br />On revient vers toi.</h1>
          <p className="rej-chapo">Chaque demande est étudiée personnellement. Si ta candidature est retenue, tu reçois ton accès sur WhatsApp sous 72 h.</p>
        </div>
      ) : (
        <div className="rej-grille">
          <div className="rej-pitch">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p className="label" style={{ margin: 0 }}>Les ambassadeurs de La Commerciale</p>
              <h1 className="rej-titre">Fais vivre<br />le jeudi.<br /><em>Le club<br />te le rend.</em></h1>
              <p className="rej-chapo">Le XOXO Club, c&apos;est le cercle privé de La Commerciale. Tu relaies les soirées, tu ramènes tes potes, tu gagnes des points. Et tu les échanges contre des privilèges que personne d&apos;autre n&apos;a.</p>
              <ul className="rej-faits">
                <li>Gratuit</li>
                <li>Sur sélection</li>
                <li>18 ans et plus</li>
              </ul>
              <a href="#demande" className="btn rej-cta-mobile">
                Demander mon accès
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
              </a>
            </div>

            <section className="rej-bloc" aria-labelledby="rej-points">
              <h2 className="rej-h2" id="rej-points">Comment tu gagnes des points</h2>
              <div className="liste">
                <div className="liste-ligne">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /></svg>
                  <span>Les missions<small>Une story, un relais, une invitation. Tu envoies ta capture, l&apos;équipe valide.</small></span>
                </div>
                <div className="liste-ligne">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" /><path d="M14 6v12" strokeDasharray="2 3" /></svg>
                  <span>Ton code perso<small>Chaque billet acheté avec ton code te rapporte des points.</small></span>
                </div>
                <div className="liste-ligne">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" /></svg>
                  <span>Ta team<small>Un classement des membres et des teams, remis à zéro chaque mois.</small></span>
                </div>
              </div>
            </section>

            <section className="rej-bloc" aria-labelledby="rej-gains">
              <h2 className="rej-h2" id="rej-gains">Ce que tu y gagnes</h2>
              <div className="liste">
                <div className="liste-ligne">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12v9H4v-9" /><path d="M2 7h20v5H2z" /><path d="M12 21V7" /><path d="M12 7c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1" /></svg>
                  <span>Des privilèges réservés au club<small>Tu les débloques avec tes points. L&apos;équipe te les remet le soir même.</small></span>
                </div>
                <div className="liste-ligne">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M7 15h4M7 11h2" /></svg>
                  <span>Ta carte membre<small>Dans Apple Wallet ou Google Wallet, avec ton solde à jour.</small></span>
                </div>
                <div className="liste-ligne">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.1l1.4-7L2 9.3l7-.8z" /></svg>
                  <span>Des points qui restent<small>Ton solde n&apos;expire pas. On n&apos;y gagne pas d&apos;argent, on y gagne des privilèges.</small></span>
                </div>
              </div>
            </section>

            <section className="rej-bloc" aria-labelledby="rej-etapes">
              <h2 className="rej-h2" id="rej-etapes">Comment entrer</h2>
              <ol className="liste rej-etapes">
                <li className="liste-ligne"><span>Tu te présentes<small>Ton Instagram, ton numéro WhatsApp, et pourquoi toi.</small></span></li>
                <li className="liste-ligne"><span>L&apos;équipe étudie ta demande<small>Réponse sur WhatsApp sous 72 h.</small></span></li>
                <li className="liste-ligne"><span>Tu reçois ton accès<small>Connexion par code WhatsApp, sans mot de passe. Tes premières missions t&apos;attendent.</small></span></li>
              </ol>
            </section>
          </div>

          {formulaire}
        </div>
      )}

      <p className="rej-pied">
        <Link href="/ambassadeurs/faq" style={{ color: "var(--gris)" }}>Questions fréquentes</Link> · <Link href="/ambassadeurs/mentions-legales" style={{ color: "var(--gris)" }}>Mentions légales</Link> · <Link href="/ambassadeurs/confidentialite" style={{ color: "var(--gris)" }}>Confidentialité</Link>
      </p>
    </div>
  );
}
