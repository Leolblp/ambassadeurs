"use client";

import { useEffect, useMemo, useState } from "react";
import { copier, useToast, ICO_PARTAGE } from "./Partage";

export type Media = { id: string; nom: string; type: "image" | "video"; dossier: string };

const miniature = (id: string, l = 360) => `https://lh3.googleusercontent.com/d/${id}=w${l}`;
const original = (m: Media) => (m.type === "image" ? `https://lh3.googleusercontent.com/d/${m.id}=s0` : `/api/media/${m.id}`);

/** Kit de la soirée : les visuels et vidéos du Drive, visibles directement et partageables en story en un geste. */
export default function KitVisuels({ medias, texte }: { medias: Media[]; texte: string }) {
  const { toast, el } = useToast();
  const groupes = useMemo(() => [...new Set(medias.map((m) => m.dossier))], [medias]);
  const [filtre, setFiltre] = useState("");
  const [ouvert, setOuvert] = useState<Media | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const visibles = medias.filter((m) => !filtre || m.dossier === filtre);

  useEffect(() => {
    if (!ouvert) return;
    const touche = (e: KeyboardEvent) => { if (e.key === "Escape" && !envoi) setOuvert(null); };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [ouvert, envoi]);

  async function partager(m: Media) {
    setEnvoi(true);
    try {
      const r = await fetch(original(m));
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const fichier = new File([blob], m.nom, { type: blob.type || (m.type === "video" ? "video/mp4" : "image/png") });
      if (navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier] });
      } else {
        // ordinateur ou navigateur sans partage de fichiers : on télécharge
        const a = document.createElement("a");
        a.href = URL.createObjectURL(fichier); a.download = fichier.name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        await copier(texte);
        toast("Téléchargé · texte de story copié");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) toast("Impossible de récupérer ce fichier, réessaie");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="carte" style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14 }} aria-labelledby="kit-titre">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h2 id="kit-titre" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Kit de la soirée</h2>
          <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--gris)" }}>{medias.length} visuel{medias.length > 1 ? "s" : ""} à reposter</p>
        </div>
      </div>

      {groupes.length > 1 && (
        <div className="puces">
          <button type="button" className="puce" aria-pressed={!filtre} onClick={() => setFiltre("")}>Tout</button>
          {groupes.map((g) => <button type="button" key={g} className="puce" aria-pressed={filtre === g} onClick={() => setFiltre(g)}>{g}</button>)}
        </div>
      )}

      <div className="kit-grille">
        {visibles.map((m) => (
          <button type="button" key={m.id} className={`kit-vignette${/story/i.test(m.dossier) || m.type === "video" ? " haute" : ""}`} onClick={() => setOuvert(m)} aria-label={`Ouvrir ${m.nom}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={miniature(m.id)} alt="" loading="lazy" />
            {m.type === "video" && <span className="kit-lecture" aria-hidden="true">▶</span>}
          </button>
        ))}
      </div>

      {ouvert && (
        <div className="voile" onClick={() => !envoi && setOuvert(null)}>
          <div className="feuille" role="dialog" aria-modal="true" aria-label="Partager ce visuel" onClick={(e) => e.stopPropagation()}>
            <span className="poignee" aria-hidden="true" />
            <div className="kit-apercu">
              {ouvert.type === "video"
                ? <video src={`/api/media/${ouvert.id}`} poster={miniature(ouvert.id, 720)} controls playsInline preload="none" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={miniature(ouvert.id, 1080)} alt={ouvert.nom} />}
            </div>
            <button type="button" className="btn" style={{ width: "100%" }} disabled={envoi} onClick={() => partager(ouvert)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICO_PARTAGE.map((d) => <path key={d} d={d} />)}</svg>
              {envoi ? (ouvert.type === "video" ? "Préparation de la vidéo…" : "Un instant…") : "Partager en story"}
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <button type="button" className="btn-second" onClick={async () => toast((await copier(texte)) ? "Texte de story copié" : "Copie impossible")}>Copier le texte</button>
              <button type="button" className="btn-second" onClick={() => setOuvert(null)}>Fermer</button>
            </div>
            <p style={{ margin: 0, textAlign: "center", fontSize: 13, color: "var(--gris)" }}>Ajoute ton code en texte sur la story pour que tes ventes comptent.</p>
          </div>
        </div>
      )}
      {el}
    </section>
  );
}
