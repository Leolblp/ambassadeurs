"use client";

import { useActionState, useMemo, useState } from "react";
import { envoyerAnnonce } from "../actions";

export type MembreCible = { id: string; nom: string; numero: string; team_id: string | null; points: number; carte: boolean };

export default function FormAnnonce({ membres, equipes }: { membres: MembreCible[]; equipes: { id: string; name: string }[] }) {
  const [res, action, envoi] = useActionState(envoyerAnnonce, null);
  const [mode, setMode] = useState<"tous" | "team" | "membres" | "points">("tous");
  const [team, setTeam] = useState("");
  const [choisis, setChoisis] = useState<string[]>([]);
  const [recherche, setRecherche] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const cibles = useMemo(() => {
    if (mode === "team") return membres.filter((m) => team && m.team_id === team);
    if (mode === "membres") return membres.filter((m) => choisis.includes(m.id));
    if (mode === "points") return membres.filter((m) => (min === "" || m.points >= Number(min)) && (max === "" || m.points <= Number(max)));
    return membres;
  }, [mode, team, choisis, min, max, membres]);
  const avecCarte = cibles.filter((m) => m.carte).length;
  const trouves = membres.filter((m) => !choisis.includes(m.id) && recherche.trim() && `${m.nom} ${m.numero}`.toLowerCase().includes(recherche.trim().toLowerCase())).slice(0, 8);

  const onglet = (id: typeof mode, label: string) => (
    <button key={id} type="button" onClick={() => setMode(id)} aria-pressed={mode === id}
      style={{ minHeight: 44, padding: "0 14px", borderRadius: 999, border: "1px solid var(--bord)", cursor: "pointer", font: "700 12px var(--font-body), system-ui", letterSpacing: ".06em", textTransform: "uppercase", background: mode === id ? "var(--rouge)" : "transparent", color: mode === id ? "var(--fond)" : "var(--gris)" }}>
      {label}
    </button>
  );

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label className="champ-label" htmlFor="texte">Message (140 caractères max)</label>
        <textarea className="champ" id="texte" name="texte" rows={3} maxLength={140} required placeholder="Ce soir, coupe-file réservé aux membres jusqu'à minuit." style={{ resize: "vertical" }} />
      </div>

      <div>
        <span className="champ-label">Destinataires</span>
        <input type="hidden" name="mode" value={mode} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {onglet("tous", "Tout le club")}
          {onglet("team", "Une team")}
          {onglet("membres", "Des membres")}
          {onglet("points", "Par points")}
        </div>
      </div>

      {mode === "team" && (
        <select className="champ" name="team_id" value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Team">
          <option value="">Choisir une team</option>
          {equipes.map((e) => <option key={e.id} value={e.id}>Team {e.name}</option>)}
        </select>
      )}

      {mode === "membres" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {choisis.map((id) => <input key={id} type="hidden" name="membres" value={id} />)}
          <input className="champ" type="search" placeholder="Rechercher un prénom, un nom ou un numéro" value={recherche} onChange={(e) => setRecherche(e.target.value)} aria-label="Rechercher un membre" />
          {trouves.length > 0 && (
            <div className="carte" style={{ borderRadius: 12, overflow: "hidden" }}>
              {trouves.map((m) => (
                <button key={m.id} type="button" onClick={() => { setChoisis([...choisis, m.id]); setRecherche(""); }}
                  style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: "10px 14px", background: "transparent", border: 0, borderBottom: "1px solid var(--bord)", color: "var(--encre)", cursor: "pointer", fontSize: 14 }}>
                  <span>{m.nom} · N° {m.numero}</span>
                  <span style={{ color: "var(--gris)", fontSize: 12 }}>{m.points} pts{m.carte ? " · carte" : ""}</span>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {choisis.map((id) => {
              const m = membres.find((x) => x.id === id);
              return (
                <button key={id} type="button" onClick={() => setChoisis(choisis.filter((x) => x !== id))}
                  style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid var(--bord-rouge)", background: "transparent", color: "var(--encre)", fontSize: 13, cursor: "pointer" }}>
                  {m?.nom} ✕
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === "points" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <div><label className="champ-label" htmlFor="min">Au moins (pts)</label><input className="champ" id="min" name="min" type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="ex. 200" /></div>
          <div><label className="champ-label" htmlFor="max">Au plus (pts)</label><input className="champ" id="max" name="max" type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="ex. 399" /></div>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 13, color: "var(--gris)" }}>
        <b style={{ color: "var(--encre)" }}>{cibles.length}</b> membre{cibles.length > 1 ? "s" : ""} ciblé{cibles.length > 1 ? "s" : ""}, dont <b style={{ color: avecCarte ? "var(--vert)" : "var(--encre)" }}>{avecCarte}</b> avec la carte dans leur Wallet (ceux-là reçoivent la notification).
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" className="btn" disabled={envoi || cibles.length === 0} style={{ minHeight: 46 }}>{envoi ? "Envoi…" : "Envoyer la notification"}</button>
        {res && <span role="status" style={{ fontSize: 13, color: res.ok ? "var(--vert)" : "var(--rouge)" }}>{res.message}</span>}
      </div>
    </form>
  );
}
