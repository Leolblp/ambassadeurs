import Image from "next/image";
import { getMembre, numero, pts, RAISON } from "@/lib/membre";
import Copier from "../../_components/Copier";
import Deconnexion from "./Deconnexion";
import ReglageWhatsApp from "./ReglageWhatsApp";

export default async function Carte() {
  const { supabase, user, profil, solde } = await getMembre();
  const { data: historique } = await supabase
    .from("points_ledger")
    .select("id, delta, reason, note, created_at")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const depuis = new Date(profil.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const nom = [profil.first_name, profil.last_name].filter(Boolean).join(" ") || "Membre";

  return (
    <div className="ecran grain" style={{ gap: 20, minHeight: "auto" }}>
      <div>
        <p className="label" style={{ margin: 0 }}>Ma carte</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 34, lineHeight: 1.05 }}>Strictement personnelle.</h1>
      </div>

      <div style={{ alignSelf: "center", width: "min(340px, 100%)", aspectRatio: "1.586", borderRadius: 18, padding: "20px 22px", background: "var(--carte)", border: "1px solid var(--bord-rouge)", boxShadow: "0 30px 60px rgba(0,0,0,.6)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Image src="/logo-xoxo.png" alt="XOXO Club" width={96} height={57} />
          <div className="label-gris" style={{ textAlign: "right" }}>
            Membre<br />
            <span className="display" style={{ fontSize: 26, letterSpacing: ".04em", color: "var(--encre)" }}>N° {numero(profil.member_number)}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div className="display" style={{ fontSize: 22, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nom}</div>
            <div style={{ fontSize: 11, color: "var(--gris)", marginTop: 2 }}>Membre depuis {depuis}</div>
          </div>
          <div className="label" style={{ fontSize: 9 }}>La Commerciale</div>
        </div>
      </div>

      <a href="/api/wallet/pass" style={{ alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 10, minHeight: 48, padding: "0 22px", borderRadius: 12, background: "#000", color: "#fff", border: "1px solid #3a3a3a", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
        <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true"><rect x="1" y="1" width="20" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="1.6" /><path d="M1 6h20M1 10h20" stroke="#ff1a1a" strokeWidth="1.6" /></svg>
        Ajouter à Apple Wallet
      </a>

      {profil.promo_code && (
        <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", border: "1px dashed var(--bord-rouge)", borderRadius: 14 }}>
          <div>
            <div className="label-gris">Ton code membre</div>
            <div className="display" style={{ fontSize: 22, letterSpacing: ".08em", marginTop: 2 }}>{profil.promo_code}</div>
          </div>
          <Copier code={profil.promo_code} />
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
      </section>

      <ReglageWhatsApp tel={profil.phone ?? null} optin={!!profil.whatsapp_optin} />

      {profil.role === "admin" && (
        <a href="/ambassadeurs/admin" className="btn" style={{ alignSelf: "center" }}>Back-office équipe</a>
      )}
      <a href="/ambassadeurs/faq" style={{ alignSelf: "center", fontSize: 14 }}>Questions fréquentes</a>
      <Deconnexion />
    </div>
  );
}
