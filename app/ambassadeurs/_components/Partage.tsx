"use client";

import { useEffect, useState } from "react";

export async function copier(texte: string) {
  try { await navigator.clipboard.writeText(texte); return true; } catch { return false; }
}

/** Petit message de confirmation en haut d'écran. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(t);
  }, [msg]);
  return { toast: setMsg, el: msg ? <div className="toast" role="status">{msg}</div> : null };
}

const Ico = ({ d }: { d: string[] }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d.map((x) => <path key={x} d={x} />)}</svg>
);
export const ICO_PARTAGE = ["M12 3v13", "M7 8l5-5 5 5", "M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"];
const ICO_COPIE = ["M9 9h10v12H9z", "M5 15V3h10"];

/** Partage rapide : le texte de la soirée avec le code et le lien perso, en un geste. */
export default function Partage({ code, texte, lien }: { code: string | null; texte: string; lien: string | null }) {
  const { toast, el } = useToast();
  const copie = async (t: string, ok: string) => toast((await copier(t)) ? ok : "Copie impossible sur ce navigateur");
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-label="Partager la soirée">
      {code && (
        <button type="button" className="code-perso" onClick={() => copie(code, "Code copié")}>
          <span>
            <span className="label-gris" style={{ display: "block" }}>Ton code</span>
            <span className="display" style={{ display: "block", fontSize: 26, letterSpacing: ".08em", marginTop: 2 }}>{code}</span>
          </span>
          <Ico d={ICO_COPIE} />
        </button>
      )}
      <button type="button" className="btn" style={{ width: "100%", minHeight: 56 }} onClick={async () => {
        if (navigator.share) { try { await navigator.share({ text: texte }); } catch { /* partage annulé */ } return; }
        copie(texte, "Texte copié : colle-le dans ta story");
      }}>
        <Ico d={ICO_PARTAGE} /> Partager la soirée
      </button>
      <div style={{ display: "grid", gridTemplateColumns: lien ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 10 }}>
        {lien && <button type="button" className="btn-second" onClick={() => copie(lien, "Lien copié")}><Ico d={ICO_COPIE} /> Copier mon lien</button>}
        <button type="button" className="btn-second" onClick={() => copie(texte, "Texte copié")}><Ico d={ICO_COPIE} /> Copier le texte</button>
      </div>
      {el}
    </section>
  );
}
