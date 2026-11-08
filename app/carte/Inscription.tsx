"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import CarteFid from "../_components/CarteFid";
import { inscrire, renvoyer, valider, type EtatInscription } from "./actions";

export default function Inscription() {
  const [etat, envoyer, enCours] = useActionState<EtatInscription, FormData>(inscrire, null);
  const [etatCode, verifier, verif] = useActionState<EtatInscription, FormData>(valider, null);
  const [etatRelance, relancer, relance] = useActionState<EtatInscription, FormData>(renvoyer, null);

  // L'étape affichée suit la dernière réponse reçue, quelle que soit l'action qui l'a produite
  const [dernier, setDernier] = useState<EtatInscription>(null);
  useEffect(() => { if (etat) setDernier(etat); }, [etat]);
  useEffect(() => { if (etatCode) setDernier(etatCode); }, [etatCode]);
  useEffect(() => { if (etatRelance) setDernier(etatRelance); }, [etatRelance]);
  const [tel, setTel] = useState("");
  useEffect(() => { if (dernier?.tel) setTel(dernier.tel); }, [dernier]);
  const surCode = dernier?.etape === "code";
  const erreurForm = dernier?.etape === "form" ? dernier.erreur : undefined;
  const erreurCode = dernier?.etape === "code" ? dernier.erreur : undefined;

  return (
    <div className="grain" style={{ minHeight: "100dvh", background: "radial-gradient(90% 60% at 50% 0%, rgba(255, 26, 26, .12), transparent 70%)" }}>
    <div className="ecran" style={{ gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" aria-label="Retour" style={{ display: "inline-flex", width: 44, height: 44, alignItems: "center", justifyContent: "center", border: "1px solid var(--bord)", borderRadius: "50%" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        </Link>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={72} height={43} />
        <div style={{ width: 44 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="label" style={{ margin: 0 }}>La carte · gratuite</p>
        <h1 className="serif" style={{ margin: 0, fontSize: 38, lineHeight: 1.05 }}>Ta carte La Commerciale.</h1>
      </div>

      <CarteFid />

      {!surCode ? (
        <>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Coupe-file", "à chaque soirée"],
              ["1 shot offert", "à chaque soirée"],
              ["Une surprise", "pendant ton mois d'anniversaire"],
            ].map(([t, d]) => (
              <li key={t} style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 15 }}>
                <span aria-hidden="true" style={{ color: "var(--rouge)" }}>✕</span>
                <span><b>{t}</b> <span style={{ color: "var(--gris)" }}>{d}</span></span>
              </li>
            ))}
          </ul>

          <form action={envoyer} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <div><label className="champ-label" htmlFor="prenom">Prénom</label><input className="champ" id="prenom" name="prenom" required autoComplete="given-name" /></div>
              <div><label className="champ-label" htmlFor="nom">Nom</label><input className="champ" id="nom" name="nom" required autoComplete="family-name" /></div>
            </div>
            <div><label className="champ-label" htmlFor="tel">Téléphone (WhatsApp)</label><input className="champ" id="tel" name="tel" type="tel" autoComplete="tel" required placeholder="06 12 34 56 78" /></div>
            <div><label className="champ-label" htmlFor="email">Email</label><input className="champ" id="email" name="email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} /></div>
            <div><label className="champ-label" htmlFor="naissance">Date de naissance</label><input className="champ" id="naissance" name="naissance" type="date" required autoComplete="bday" /></div>

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, color: "var(--gris)", cursor: "pointer" }}>
              <input type="checkbox" name="cgu" required style={{ marginTop: 1, accentColor: "var(--rouge)" }} />
              <span>J&apos;ai 18 ans ou plus et j&apos;accepte la <Link href="/ambassadeurs/confidentialite" target="_blank" style={{ color: "var(--encre)" }}>politique de confidentialité</Link>. Mon code de connexion m&apos;est envoyé sur WhatsApp.</span>
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, color: "var(--gris)", cursor: "pointer" }}>
              <input type="checkbox" name="marketing" defaultChecked={false} style={{ marginTop: 1, accentColor: "var(--rouge)" }} />
              <span>Je veux recevoir les infos et soirées de La Commerciale sur WhatsApp (facultatif, désactivable depuis ma carte).</span>
            </label>

            {erreurForm && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>{erreurForm}</p>}

            <button className="btn" type="submit" disabled={enCours} style={{ width: "100%", marginTop: 4 }}>
              {enCours ? "Envoi du code…" : "Recevoir mon code sur WhatsApp"}
            </button>
            <p style={{ margin: 0, textAlign: "center", fontSize: 13, color: "var(--gris)" }}>
              Déjà une carte ? <Link href="/ambassadeurs/connexion" style={{ color: "var(--encre)" }}>Me connecter</Link>
            </p>
          </form>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, lineHeight: 1.55, color: "var(--gris)" }}>
            Si ce numéro peut recevoir un code, il arrive sur WhatsApp au <b style={{ color: "var(--encre)" }}>{tel}</b>.
          </p>
          <form action={verifier} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input type="hidden" name="tel" value={tel} />
            <div>
              <label className="champ-label" htmlFor="code">Code à 6 chiffres</label>
              <input className="champ" id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6,8}" maxLength={8} required autoFocus style={{ fontSize: 24, letterSpacing: ".3em", textAlign: "center" }} />
            </div>
            {erreurCode && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 14 }}>{erreurCode}</p>}
            <button className="btn" type="submit" disabled={verif} style={{ width: "100%" }}>{verif ? "Vérification…" : "Activer ma carte"}</button>
          </form>
          <form action={relancer} style={{ alignSelf: "center" }}>
            <input type="hidden" name="tel" value={tel} />
            <button type="submit" disabled={relance} style={{ minHeight: 44, padding: "0 12px",  background: "none", border: 0, color: "var(--gris)", fontSize: 14, textDecoration: "underline", cursor: "pointer" }}>
              {relance ? "Envoi…" : "Renvoyer le code"}
            </button>
          </form>
        </div>
      )}
    </div>
    </div>
  );
}