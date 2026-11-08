"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import jsQR from "jsqr";
import { chercher, valider, type Fiche } from "./actions";

type Avantage = "coupe_file" | "shot" | "anniv";
const BOUTONS: { a: Avantage; label: string; fait: string }[] = [
  { a: "coupe_file", label: "Coupe-file", fait: "Coupe-file utilisé" },
  { a: "shot", label: "Servir le shot", fait: "Shot déjà servi" },
  { a: "anniv", label: "Surprise anniv", fait: "Surprise déjà remise" },
];
const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const dernier = useRef("");
  const [camera, setCamera] = useState<"off" | "on" | "refus">("off");
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [saisie, setSaisie] = useState("");
  const [enCours, demarrer] = useTransition();

  const arreter = useCallback(() => {
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
    setCamera("off");
  }, []);

  const lire = useCallback((texte: string) => {
    demarrer(async () => {
      const r = await chercher(texte);
      if (r.ok) { setFiche(r.fiche); setMessage(null); arreter(); navigator.vibrate?.(80); }
      else { setFiche(null); setMessage({ ok: false, texte: r.message }); navigator.vibrate?.([60, 60, 60]); }
    });
  }, [arreter]);

  async function allumer() {
    setFiche(null); setMessage(null); dernier.current = "";
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      flux.current = s;
      if (video.current) { video.current.srcObject = s; await video.current.play(); }
      setCamera("on");
    } catch { setCamera("refus"); }
  }

  useEffect(() => {
    if (camera !== "on") return;
    let id = 0;
    const boucle = () => {
      const v = video.current, c = toile.current;
      if (v && c && v.readyState >= 2) {
        const l = 480, h = Math.round((v.videoHeight / v.videoWidth) * l) || 360;
        c.width = l; c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(v, 0, 0, l, h);
        const code = jsQR(ctx.getImageData(0, 0, l, h).data, l, h, { inversionAttempts: "dontInvert" });
        if (code?.data && code.data !== dernier.current) { dernier.current = code.data; lire(code.data); return; }
      }
      id = requestAnimationFrame(boucle);
    };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
  }, [camera, lire]);

  useEffect(() => arreter, [arreter]);

  function appliquer(a: Avantage) {
    if (!fiche) return;
    demarrer(async () => {
      const r = await valider(fiche.id, a);
      if (r.ok) { setFiche(r.fiche); setMessage({ ok: r.message !== "Déjà utilisé.", texte: r.message ?? "" }); }
      else setMessage({ ok: false, texte: r.message });
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 18, overflow: "hidden", border: "1px solid var(--bord-rouge)", background: "#000", display: fiche ? "none" : "block" }}>
        <video ref={video} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: camera === "on" ? "block" : "none" }} />
        {camera === "on" && <div aria-hidden="true" style={{ position: "absolute", inset: "18%", border: "2px solid var(--rouge)", borderRadius: 16, boxShadow: "0 0 0 2000px rgba(0,0,0,.35)" }} />}
        {camera !== "on" && (
          <button className="btn" type="button" onClick={allumer} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
            {camera === "refus" ? "Autoriser la caméra" : "Scanner une carte"}
          </button>
        )}
        <canvas ref={toile} hidden />
      </div>

      {!fiche && (
        <form onSubmit={(e) => { e.preventDefault(); if (saisie.trim()) lire(saisie); }} style={{ display: "flex", gap: 8 }}>
          <input className="champ" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Ou N° de carte" aria-label="Numéro de carte" inputMode="numeric" style={{ flexGrow: 1 }} />
          <button className="btn" type="submit" disabled={enCours} style={{ minHeight: 48 }}>OK</button>
        </form>
      )}

      {message && (
        <p role="status" style={{ margin: 0, padding: "12px 14px", borderRadius: 12, fontWeight: 700, background: message.ok ? "rgba(61,220,132,.12)" : "rgba(255,26,26,.12)", color: message.ok ? "var(--vert)" : "var(--rouge)" }}>{message.texte}</p>
      )}

      {fiche && (
        <section className="carte" style={{ borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 14, border: "1px solid var(--bord-rouge)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div className="label">{fiche.niveau} · N° {fiche.numero}</div>
              <div className="display" style={{ fontSize: 28, textTransform: "uppercase", marginTop: 4 }}>{fiche.nom}</div>
              {fiche.naissance && <div style={{ fontSize: 13, color: fiche.anniv ? "var(--ambre)" : "var(--gris)", marginTop: 2 }}>{fiche.anniv ? "Mois d'anniversaire · " : "Anniversaire le "}{fiche.naissance}</div>}
            </div>
          </div>
          {fiche.manuel && (
            <p role="alert" style={{ margin: 0, padding: "10px 12px", borderRadius: 10, background: "rgba(255,176,32,.12)", color: "var(--ambre)", fontSize: 14, fontWeight: 700 }}>
              Saisie manuelle : vérifie que le nom correspond à la personne (pièce d&apos;identité).
            </p>
          )}
          {BOUTONS.filter((b) => b.a !== "anniv" || fiche.anniv).map((b) => {
            const fait = fiche.deja[b.a];
            return (
              <button key={b.a} type="button" className="btn" disabled={enCours || !!fait} onClick={() => appliquer(b.a)}
                style={{ width: "100%", minHeight: 56, opacity: fait ? .45 : 1, background: fait ? "transparent" : undefined, border: fait ? "1px solid var(--bord)" : undefined }}>
                {fait ? `${b.fait} · ${heure(fait)}` : b.label}
              </button>
            );
          })}
          <button type="button" onClick={allumer} style={{ background: "none", border: 0, color: "var(--encre)", fontSize: 15, textDecoration: "underline", cursor: "pointer", minHeight: 48, padding: "0 12px" }}>Scanner la carte suivante</button>
        </section>
      )}
    </div>
  );
}
