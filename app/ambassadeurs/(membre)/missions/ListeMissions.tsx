"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PREUVE, dateCourte } from "@/lib/format";

export type Mission = {
  id: string;
  title: string;
  description: string | null;
  points: number;
  deadline: string | null;
  proof_type: string;
  etat: "afaire" | "attente" | "validee" | "expiree";
  refus: string | null;
};

const ONGLETS = [
  { id: "afaire", label: "À faire" },
  { id: "attente", label: "En attente" },
  { id: "validee", label: "Validées" },
] as const;

export default function ListeMissions({ missions, uid }: { missions: Mission[]; uid: string }) {
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("afaire");
  const visibles = missions.filter((m) => m.etat === onglet);

  return (
    <>
      <div role="tablist" aria-label="Filtrer les missions" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, margin: "14px 0 8px", padding: 4, background: "var(--carte)", border: "1px solid var(--bord)", borderRadius: 999 }}>
        {ONGLETS.map((o) => {
          const n = missions.filter((m) => m.etat === o.id).length;
          const actif = o.id === onglet;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={actif}
              onClick={() => setOnglet(o.id)}
              style={{
                minHeight: 44, border: 0, borderRadius: 999, cursor: "pointer",
                background: actif ? "var(--rouge)" : "transparent", color: actif ? "var(--fond)" : "var(--gris)",
                font: "700 12px var(--font-body), system-ui, sans-serif", letterSpacing: ".08em", textTransform: "uppercase",
              }}
            >
              {o.label}{n > 0 ? ` · ${n}` : ""}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibles.length === 0 && (
          <p className="carte" style={{ margin: 0, padding: 16, color: "var(--gris)", fontSize: 14 }}>
            {onglet === "afaire" ? "Rien à faire pour l'instant. Les prochaines missions arrivent bientôt." : onglet === "attente" ? "Aucune preuve en attente de validation." : "Aucune mission validée pour l'instant."}
          </p>
        )}
        {visibles.map((m) => <CarteMission key={m.id} m={m} uid={uid} />)}
      </div>
    </>
  );
}

function CarteMission({ m, uid }: { m: Mission; uid: string }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lien, setLien] = useState("");
  const [capture, setCapture] = useState<File | null>(null);

  async function envoyer(fichierChoisi: File | null) {
    let fichier = fichierChoisi;
    setErreur(null);
    setEnvoi(true);
    const supabase = createClient();
    let file_path: string | null = null;

    if (fichier && !fichier.type.startsWith("image/")) {
      setErreur("Envoie une capture d'écran (image), pas de vidéo.");
      setEnvoi(false);
      return;
    }
    if (fichier) fichier = await compresser(fichier);

    if (fichier) {
      if (fichier.size > 10 * 1024 * 1024) {
        setErreur("Image trop lourde (10 Mo maximum).");
        setEnvoi(false);
        return;
      }
      const ext = (fichier.name.split(".").pop() || "jpg").toLowerCase();
      file_path = `${uid}/${m.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("proofs").upload(file_path, fichier, { contentType: fichier.type });
      if (error) {
        setErreur("L'envoi du fichier a échoué. Réessaie.");
        setEnvoi(false);
        return;
      }
    }

    const { error } = await supabase.from("proofs").insert({ mission_id: m.id, member_id: uid, file_path, link: lien.trim() || null });
    setEnvoi(false);
    if (error) {
      setErreur(error.code === "23505" ? "Tu as déjà envoyé une preuve pour cette mission." : "L'envoi a échoué. Réessaie.");
      return;
    }
    router.refresh();
  }

  return (
    <article className="carte" style={{ borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{m.title}</h2>
          <div style={{ fontSize: 12, color: "var(--gris)", marginTop: 4 }}>
            {m.deadline ? `Avant ${dateCourte(m.deadline)} · ` : ""}Preuve : {PREUVE[m.proof_type] ?? "capture"}
          </div>
        </div>
        <span style={{ flex: "none", padding: "6px 10px", borderRadius: 99, background: "var(--bord)", fontSize: 12, fontWeight: 800 }}>+{m.points}</span>
      </div>

      {m.description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--encre)" }}>{m.description}</p>}

      {m.refus && m.etat === "afaire" && (
        <p role="status" style={{ margin: 0, padding: "10px 12px", borderRadius: 10, background: "#2a0d0d", fontSize: 13, color: "var(--encre)" }}>
          <b style={{ color: "var(--rouge)" }}>À refaire :</b> {m.refus}
        </p>
      )}

      {m.etat === "afaire" && m.proof_type === "tickets" && (
        <div style={{ fontSize: 13, color: "var(--gris)" }}>Validée automatiquement : chaque billet acheté avec ton code compte.</div>
      )}

      {m.etat === "afaire" && m.proof_type === "link" && (
        <div style={{ display: "flex", gap: 8 }}>
          <label htmlFor={`lien-${m.id}`} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Lien de ta publication</label>
          <input id={`lien-${m.id}`} className="champ" type="url" placeholder="https://instagram.com/…" value={lien} onChange={(e) => setLien(e.target.value)} />
          <button className="btn" type="button" disabled={envoi || !lien.trim()} onClick={() => envoyer(null)} style={{ padding: "0 18px", minHeight: 48 }}>{envoi ? "Envoi…" : "Envoyer"}</button>
        </div>
      )}

      {m.etat === "afaire" && m.proof_type === "screenshot_link" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 52, border: "1px dashed var(--bord-rouge)", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {capture ? `Capture : ${capture.name}` : "1. Choisir ma capture"}
            <input type="file" accept="image/*" disabled={envoi} onChange={(e) => setCapture(e.target.files?.[0] ?? null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
          </label>
          <label htmlFor={`lien-${m.id}`} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Lien de ta vidéo</label>
          <input id={`lien-${m.id}`} className="champ" type="url" placeholder="2. Lien de ta vidéo (https://…)" value={lien} onChange={(e) => setLien(e.target.value)} />
          <button className="btn" type="button" disabled={envoi || !capture || !lien.trim()} onClick={() => envoyer(capture)} style={{ minHeight: 48 }}>
            {envoi ? "Envoi en cours…" : "Envoyer ma preuve"}
          </button>
        </div>
      )}

      {m.etat === "afaire" && m.proof_type === "screenshot" && (
        <label style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 52, border: "1px dashed var(--bord-rouge)", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: envoi ? "default" : "pointer" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 20h16" /></svg>
          {envoi ? "Envoi en cours…" : "Envoyer ma preuve"}
          <input
            type="file"
            accept="image/*"
            disabled={envoi}
            onChange={(e) => envoyer(e.target.files?.[0] ?? null)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          />
        </label>
      )}

      {m.etat === "attente" && <Statut couleur="var(--ambre)">Preuve envoyée · en cours de validation</Statut>}
      {m.etat === "validee" && <Statut couleur="var(--vert)">Validée · {m.points} points crédités</Statut>}
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--rouge)", fontSize: 13 }}>{erreur}</p>}
    </article>
  );
}

function Statut({ couleur, children }: { couleur: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: couleur }}>
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: couleur }} />
      {children}
    </div>
  );
}

/** Réduit une photo à 1600 px de large max en JPEG (une capture passe de ~3 Mo à ~300 Ko). */
async function compresser(f: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(f);
    const echelle = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (echelle === 1 && f.size < 800 * 1024) return f;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * echelle);
    canvas.height = Math.round(bitmap.height * echelle);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : f;
  } catch {
    return f; // format non lu par le navigateur (ex. HEIC sur certains Android) : envoi tel quel
  }
}
