import { GRILLE, gains, precedent, prochain } from "@/lib/paliers";

/** Compteur de la soirée : billets vendus, prochain palier, avantages débloqués. */
export function PaliersSoiree({ ventes, soiree }: { ventes: number; soiree?: string | null }) {
  const acquis = gains(ventes);
  const suite = prochain(ventes);
  const depart = precedent(ventes);
  const avance = Math.max(4, Math.min(100, Math.round(((ventes - depart) / (suite.seuil - depart)) * 100)));
  return (
    <section className="carte" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }} aria-labelledby="paliers-titre">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h2 id="paliers-titre" className="label-gris" style={{ margin: 0 }}>Tes ventes {soiree ? "pour cette soirée" : "cette semaine"}</h2>
          <div className="display" style={{ fontSize: 56, lineHeight: 1, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{ventes}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 14, color: "var(--gris)", maxWidth: "55%" }}>
          Encore <b style={{ color: "var(--encre)" }}>{suite.reste}</b> pour<br /><b style={{ color: "var(--rouge)" }}>{suite.titre}</b>
        </div>
      </div>
      <div role="progressbar" aria-valuemin={depart} aria-valuemax={suite.seuil} aria-valuenow={ventes} aria-label={`Vers le palier de ${suite.seuil} ventes`} style={{ height: 6, borderRadius: 99, background: "var(--bord)", overflow: "hidden" }}>
        <div style={{ width: `${avance}%`, height: "100%", background: "var(--rouge)", borderRadius: 99 }} />
      </div>
      {acquis.length > 0 ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {acquis.map((g) => (
            <li key={g.cle} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 15 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rouge)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", transform: "translateY(1px)" }}><path d="M4 12l6 6L20 6" /></svg>
              <span><b>{g.titre}</b> <span style={{ color: "var(--gris)" }}>{g.detail}</span></span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: "var(--gris)" }}>Chaque billet acheté avec ton code compte. Le compteur repart à zéro à chaque soirée.</p>
      )}
    </section>
  );
}

/** La grille complète des paliers. */
export function GrillePaliers({ ventes = 0 }: { ventes?: number }) {
  return (
    <div className="liste">
      {GRILLE.map((p) => {
        const atteint = ventes >= Number(p.ventes);
        return (
          <div key={p.ventes} className="liste-ligne" style={{ alignItems: "flex-start" }}>
            <span className="display" aria-hidden="true" style={{ flex: "none", width: 44, fontSize: 26, lineHeight: 1.1, textAlign: "right", color: atteint ? "var(--rouge)" : "var(--encre)", fontVariantNumeric: "tabular-nums" }}>{p.ventes}</span>
            <span><span><span className="sr-only">{p.ventes} ventes : </span>{p.titre}{atteint && <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: "var(--rouge)" }}>Débloqué</span>}</span><small>{p.detail}</small></span>
          </div>
        );
      })}
    </div>
  );
}
