// Briques de mise en page pour les guides et la FAQ (composants serveur, sans JavaScript)

export function Sommaire({ items }: { items: { id: string; titre: string }[] }) {
  return (
    <nav aria-label="Sommaire" className="carte" style={{ borderRadius: 16, padding: "16px 18px" }}>
      <div className="label-gris" style={{ marginBottom: 10 }}>Sommaire</div>
      <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 14 }}>
        {items.map((it) => (
          <li key={it.id}><a href={`#${it.id}`} style={{ textDecoration: "none" }}>{it.titre}</a></li>
        ))}
      </ol>
    </nav>
  );
}

export function Section({ id, numero, titre, children }: { id: string; numero?: number; titre: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 24, display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
      <h2 style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 12 }}>
        {numero !== undefined && <span className="display" style={{ fontSize: 28, color: "var(--rouge)", fontWeight: 400 }}>{String(numero).padStart(2, "0")}</span>}
        <span className="serif" style={{ fontSize: 30, lineHeight: 1.1 }}>{titre}</span>
      </h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--encre)" }}>{children}</p>;
}

export function Etapes({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span aria-hidden="true" className="display" style={{ flex: "none", width: 30, height: 30, borderRadius: "50%", background: "var(--rouge)", color: "var(--fond)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{i + 1}</span>
          <div style={{ fontSize: 15, lineHeight: 1.6, paddingTop: 3 }}>{it}</div>
        </li>
      ))}
    </ol>
  );
}

export function Liste({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 15, lineHeight: 1.6 }}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

export function Encart({ titre, ton = "info", children }: { titre: string; ton?: "info" | "attention" | "astuce"; children: React.ReactNode }) {
  const couleur = ton === "attention" ? "var(--ambre)" : ton === "astuce" ? "var(--vert)" : "var(--rouge)";
  return (
    <aside className="carte" style={{ borderRadius: 14, padding: "14px 16px", borderColor: "var(--bord)", boxShadow: `inset 3px 0 0 ${couleur}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: couleur, marginBottom: 6 }}>{titre}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{children}</div>
    </aside>
  );
}

export function Tableau({ entetes, lignes }: { entetes: string[]; lignes: React.ReactNode[][] }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--bord)", borderRadius: 14 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 420 }}>
        <thead>
          <tr>{entetes.map((e) => <th key={e} style={{ textAlign: "left", padding: "10px 14px", background: "var(--carte)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gris)", fontWeight: 700 }}>{e}</th>)}</tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i}>{l.map((c, j) => <td key={j} style={{ padding: "10px 14px", borderTop: "1px solid var(--bord)", verticalAlign: "top", fontWeight: j === 0 ? 700 : 400 }}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="carte" style={{ borderRadius: 14, padding: "14px 16px" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{q}</summary>
      <div style={{ paddingTop: 10, fontSize: 14, lineHeight: 1.65, color: "var(--encre)", display: "grid", gap: 8 }}>{children}</div>
    </details>
  );
}
