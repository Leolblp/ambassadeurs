import CarteFid from "@/app/_components/CarteFid";
import { donneesCarte } from "@/lib/wallet";
import { qrSvg } from "@/lib/qr";
import { AVANTAGES, MOIS, moisAnniv, soireeDuJour, utilisations } from "@/lib/fidelite";
import { headers } from "next/headers";
import { getMembre, numero, pts, RAISON } from "@/lib/membre";
import Copier from "../../_components/Copier";
import Deconnexion from "./Deconnexion";
import ReglageWhatsApp from "./ReglageWhatsApp";
import Naissance from "./Naissance";
import { LienCookies } from "@/app/_components/Consentement";

export default async function Carte() {
  const { supabase, user, profil, solde } = await getMembre({ carte: true });
  const ambassadeur = profil.kind !== "fidelite";
  const { data: historique } = await supabase
    .from("points_ledger")
    .select("id, delta, reason, note, created_at")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const ua = (await headers()).get("user-agent") ?? "";
  const iphone = /iPhone|iPad|iPod/i.test(ua);
  const android = /Android/i.test(ua);
  const depuis = new Date(profil.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const nom = [profil.first_name, profil.last_name].filter(Boolean).join(" ") || "Membre";

  const soiree = soireeDuJour();
  const [carte, deja] = await Promise.all([donneesCarte(user.id), utilisations(user.id, soiree)]);
  const qr = await qrSvg(carte.qr);
  const anniv = moisAnniv(profil.birth_date, soiree);
  const moisNaissance = profil.birth_date ? MOIS[Number(profil.birth_date.slice(5, 7)) - 1] : null;
  const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const lignesAvantages = [
    { cle: "coupe_file", titre: AVANTAGES.coupe_file.titre, icone: "M5 12h14M13 6l6 6-6 6", etat: deja.coupe_file ? "utilise" : "dispo", texte: deja.coupe_file ? `Utilisé ce soir à ${heure(deja.coupe_file)}` : AVANTAGES.coupe_file.detail },
    { cle: "shot", titre: AVANTAGES.shot.titre, icone: "M6 3h12l-2 18H8z M7 8h10", etat: deja.shot ? "utilise" : "dispo", texte: deja.shot ? `Servi ce soir à ${heure(deja.shot)}` : AVANTAGES.shot.detail },
    {
      cle: "anniv", titre: AVANTAGES.anniv.titre, icone: "M20 12v9H4v-9 M2 7h20v5H2z M12 21V7 M12 7c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1",
      etat: deja.anniv ? "utilise" : anniv ? "dispo" : "attente",
      texte: deja.anniv ? "Déjà profitée cette année" : anniv ? "C'est ton mois : demande ta surprise au bar" : moisNaissance ? `Disponible en ${moisNaissance}` : AVANTAGES.anniv.detail,
    },
  ];

  return (
    <div className="ecran" style={{ gap: 20, minHeight: "auto" }}>
      <div>
        <p className="label" style={{ margin: 0 }}>Ma carte</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 34, lineHeight: 1.05 }}>Strictement personnelle.</h1>
      </div>

      <CarteFid anim={false} nom={nom} numero={numero(profil.member_number)} niveau={ambassadeur ? "Ambassadeur" : "Membre"} depuis={depuis} />
      <div style={{ alignSelf: "center", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {!android && (
          <a href="/api/wallet/pass" style={styleWallet}>
            <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true"><rect x="1" y="1" width="20" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="1.6" /><path d="M1 6h20M1 10h20" stroke="#ff1a1a" strokeWidth="1.6" /></svg>
            Ajouter à Apple Wallet
          </a>
        )}
        {!iphone && (
          <a href="/api/wallet/google" style={styleWallet}>
            <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true"><rect x="1" y="1" width="20" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="1.6" /><path d="M1 6h20M1 10h20" stroke="#ff1a1a" strokeWidth="1.6" /></svg>
            Ajouter à Google Wallet
          </a>
        )}
      </div>
      <div style={{ alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div className="carte-fid-qr" style={{ width: 220, height: 220, padding: 14, borderRadius: 18 }} role="img" aria-label="QR code de ta carte" dangerouslySetInnerHTML={{ __html: qr }} />
        <p style={{ margin: 0, fontSize: 13, color: "var(--gris)", textAlign: "center" }}>Montre ce QR à l&apos;entrée et au bar. Monte la luminosité.</p>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 className="label" style={{ margin: 0 }}>Tes avantages ce soir</h2>
        {lignesAvantages.map((a) => (
          <div key={a.cle} className="avantage" data-etat={a.etat}>
            <span className="avantage-pastille" aria-hidden="true">
              {a.etat === "utilise" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icone} /></svg>
              )}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{a.titre}</div>
              <div style={{ fontSize: 12, color: "var(--gris)", marginTop: 2 }}>{a.texte}</div>
            </div>
          </div>
        ))}
      </section>

      {!profil.birth_date && <Naissance />}

      {profil.promo_code && (
        <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", border: "1px dashed var(--bord-rouge)", borderRadius: 14 }}>
          <div>
            <div className="label-gris">Ton code membre</div>
            <div className="display" style={{ fontSize: 22, letterSpacing: ".08em", marginTop: 2 }}>{profil.promo_code}</div>
          </div>
          <Copier code={profil.promo_code} />
        </section>
      )}

      {!ambassadeur && (
        <a href="/ambassadeurs/carte/ambassadeur" className="carte" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderRadius: 14, border: "1px dashed var(--bord-rouge)", textDecoration: "none" }}>
          <div>
            <div className="label">Programme ambassadeur</div>
            <div style={{ fontSize: 14, marginTop: 4, color: "var(--gris)" }}>Fais venir ton monde, gagne des points et des privilèges.</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      )}

      {ambassadeur && <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="label" style={{ margin: 0 }}>Historique des points</h2>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{pts(solde)} pts</span>
        </div>
        {(historique ?? []).length === 0 ? (
          <p className="carte" style={{ margin: 0, padding: 16, color: "var(--gris)", fontSize: 14 }}>Tes premiers points apparaîtront ici.</p>
        ) : (
          (historique ?? []).map((h) => (
            <div key={h.id} className="carte" style={{ borderRadius: 14, padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{h.note || RAISON[h.reason] || "Points"}</div>
                <div style={{ fontSize: 11, color: "var(--gris)", marginTop: 2 }}>{new Date(h.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</div>
              </div>
              <span style={{ fontWeight: 800, color: h.delta >= 0 ? "var(--vert)" : "var(--gris)", whiteSpace: "nowrap" }}>
                {h.delta >= 0 ? "+" : ""}{pts(h.delta)}
              </span>
            </div>
          ))
        )}
      </section>}

      <ReglageWhatsApp fidelite={!ambassadeur} tel={profil.phone ?? null} optin={!!profil.whatsapp_optin} />

      {(profil.role === "admin" || (profil.role as string) === "staff") && (
        <a href="/ambassadeurs/scan" className="btn" style={{ alignSelf: "center" }}>Scanner les cartes</a>
      )}
      {profil.role === "admin" && (
        <a href="/ambassadeurs/admin" className="btn" style={{ alignSelf: "center" }}>Back-office équipe</a>
      )}
      <a href="/ambassadeurs/faq" style={{ alignSelf: "center", fontSize: 14 }}>Questions fréquentes</a>
      <p style={{ alignSelf: "center", margin: 0, fontSize: 12 }}>
        <a href="/ambassadeurs/mentions-legales" style={{ color: "var(--gris)" }}>Mentions légales</a> · <a href="/ambassadeurs/confidentialite" style={{ color: "var(--gris)" }}>Confidentialité</a> · <LienCookies />
      </p>
      <Deconnexion />
    </div>
  );
}

const styleWallet: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 10, minHeight: 48, padding: "0 22px", borderRadius: 12, background: "#000", color: "#fff", border: "1px solid #3a3a3a", fontWeight: 700, fontSize: 15, textDecoration: "none" };
