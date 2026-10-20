"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Privilege = { id: string; name: string; description: string | null; cost: number; stock: number | null };

const ERREURS: Record<string, string> = {
  "not enough points": "Il te manque des points pour ce privilège.",
  "out of stock": "Ce privilège n'est plus disponible pour le moment.",
  "privilege unavailable": "Ce privilège n'est plus disponible.",
};

export default function ListePrivileges({ privileges, solde }: { privileges: Privilege[]; solde: number }) {
  const router = useRouter();
  const [confirme, setConfirme] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ id: string; ok: boolean; texte: string } | null>(null);

  async function debloquer(p: Privilege) {
    setEnvoi(true);
    const { error } = await createClient().rpc("redeem_privilege", { p_privilege: p.id });
    setEnvoi(false);
    setConfirme(null);
    if (error) {
      const cle = Object.keys(ERREURS).find((k) => error.message.includes(k));
      setMessage({ id: p.id, ok: false, texte: cle ? ERREURS[cle] : "Le déblocage a échoué. Réessaie." });
      return;
    }
    setMessage({ id: p.id, ok: true, texte: "Débloqué. Présente-toi à l'équipe le soir venu pour en profiter." });
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {privileges.map((p) => {
        const ok = solde >= p.cost && (p.stock === null || p.stock > 0);
        const pct = Math.min(100, Math.round((solde / p.cost) * 100));
        return (
          <article key={p.id} className="carte" style={{ borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 14, borderColor: ok ? "var(--bord-rouge)" : "var(--bord)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <h2 className="display" style={{ margin: 0, fontSize: 22, lineHeight: 1.1, textTransform: "uppercase", fontWeight: 400 }}>{p.name}</h2>
                {p.description && <div style={{ fontSize: 12, color: "var(--gris)", marginTop: 4 }}>{p.description}</div>}
                {p.stock !== null && p.stock > 0 && p.stock <= 5 && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ambre)", marginTop: 4, letterSpacing: ".04em" }}>Plus que {p.stock} disponible{p.stock > 1 ? "s" : ""}</div>}
              </div>
              <div style={{ flex: "none", textAlign: "right" }}>
                <div className="display" style={{ fontSize: 20, lineHeight: 1 }}>{p.cost.toLocaleString("fr-FR")}</div>
                <div className="label-gris" style={{ fontSize: 9 }}>pts</div>
              </div>
            </div>

            {ok ? (
              confirme === p.id ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <button type="button" className="btn" onClick={() => setConfirme(null)} disabled={envoi} style={{ background: "transparent", color: "var(--encre)", border: "1px solid var(--bord)", minHeight: 46, padding: 0 }}>Annuler</button>
                  <button type="button" className="btn" onClick={() => debloquer(p)} disabled={envoi} style={{ minHeight: 46, padding: 0 }}>{envoi ? "…" : `Confirmer`}</button>
                </div>
              ) : (
                <button type="button" className="btn" onClick={() => { setConfirme(p.id); setMessage(null); }} style={{ minHeight: 46, width: "100%" }}>Débloquer</button>
              )
            ) : p.stock !== null && p.stock <= 0 ? (
              <div style={{ fontSize: 12, color: "var(--gris)" }}>Épuisé pour le moment</div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--gris)", marginBottom: 6 }}>
                  <span>Encore {(p.cost - solde).toLocaleString("fr-FR")} pts</span><span>{pct} %</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--bord)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--rouge)", borderRadius: 99 }} />
                </div>
              </div>
            )}

            {message?.id === p.id && (
              <p role="status" style={{ margin: 0, fontSize: 13, color: message.ok ? "var(--vert)" : "var(--rouge)" }}>{message.texte}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
