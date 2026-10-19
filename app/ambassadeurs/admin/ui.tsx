"use client";

import { useActionState, useState, useTransition } from "react";
import type { Resultat } from "./actions";

const styleBouton = (variante: "plein" | "vert" | "contour") => ({
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 999,
  cursor: "pointer",
  font: "700 12px var(--font-body), system-ui, sans-serif",
  letterSpacing: ".1em",
  textTransform: "uppercase" as const,
  border: variante === "contour" ? "1px solid var(--bord)" : 0,
  background: variante === "plein" ? "var(--rouge)" : variante === "vert" ? "var(--vert)" : "transparent",
  color: variante === "contour" ? "var(--encre)" : "var(--fond)",
});

/** Bouton qui déclenche une action serveur et affiche le résultat. */
export function BoutonAction({
  action, label, variante = "contour", confirmer,
}: { action: () => Promise<Resultat>; label: string; variante?: "plein" | "vert" | "contour"; confirmer?: string }) {
  const [enCours, start] = useTransition();
  const [res, setRes] = useState<Resultat>(null);
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        disabled={enCours}
        style={{ ...styleBouton(variante), opacity: enCours ? 0.5 : 1 }}
        onClick={() => {
          if (confirmer && !window.confirm(confirmer)) return;
          start(async () => setRes(await action()));
        }}
      >
        {enCours ? "…" : label}
      </button>
      {res && <Message r={res} />}
    </span>
  );
}

/** Refus avec motif : affiche un champ avant d'envoyer. */
export function RefusAvecMotif({ action }: { action: (motif: string) => Promise<Resultat> }) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [enCours, start] = useTransition();
  const [res, setRes] = useState<Resultat>(null);
  if (!ouvert) return <button type="button" style={styleBouton("contour")} onClick={() => setOuvert(true)}>Refuser</button>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <label className="champ-label" htmlFor="motif">Motif envoyé au membre</label>
      <input id="motif" className="champ" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. : la story doit montrer l'affiche en entier" />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={styleBouton("contour")} onClick={() => setOuvert(false)}>Annuler</button>
        <button type="button" disabled={enCours} style={styleBouton("plein")} onClick={() => start(async () => setRes(await action(motif)))}>
          {enCours ? "…" : "Confirmer le refus"}
        </button>
      </div>
      {res && <Message r={res} />}
    </div>
  );
}

/** Formulaire branché sur une action serveur (useActionState). */
export function FormAction({
  action, children, bouton,
}: { action: (prev: Resultat, f: FormData) => Promise<Resultat>; children: React.ReactNode; bouton: string }) {
  const [res, formAction, enCours] = useActionState(action, null);
  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {children}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" disabled={enCours} className="btn" style={{ minHeight: 46 }}>{enCours ? "…" : bouton}</button>
        {res && <Message r={res} />}
      </div>
    </form>
  );
}

export function CopierTexte({ texte, label }: { texte: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      style={styleBouton("contour")}
      onClick={async () => {
        await navigator.clipboard.writeText(texte);
        setOk(true);
        setTimeout(() => setOk(false), 1800);
      }}
    >
      {ok ? "Copié" : label}
    </button>
  );
}

function Message({ r }: { r: NonNullable<Resultat> }) {
  return <span role="status" style={{ fontSize: 12, color: r.ok ? "var(--vert)" : "var(--rouge)" }}>{r.message}</span>;
}
