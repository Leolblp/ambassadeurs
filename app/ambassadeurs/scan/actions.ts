"use server";

import { requireScan } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { moisAnniv, soireeDuJour, utilisations, type Avantage } from "@/lib/fidelite";
import { numero as fmtNumero } from "@/lib/format";

export type Fiche = {
  id: string; nom: string; numero: string; niveau: string; anniv: boolean; naissance: string | null;
  deja: { coupe_file?: string; shot?: string; anniv?: string };
  manuel?: boolean;
};
export type Reponse = { ok: true; fiche: Fiche; message?: string } | { ok: false; message: string };

async function fiche(memberId: string): Promise<Fiche | null> {
  const { data: p } = await createAdminClient().from("profiles").select("id, first_name, last_name, member_number, kind, status, birth_date").eq("id", memberId).maybeSingle();
  if (!p || p.status !== "active") return null;
  const soiree = soireeDuJour();
  return {
    id: p.id, nom: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Membre", numero: fmtNumero(p.member_number),
    niveau: p.kind === "fidelite" ? "Membre" : "Ambassadeur", anniv: moisAnniv(p.birth_date, soiree),
    naissance: p.birth_date ? new Date(p.birth_date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : null,
    deja: await utilisations(p.id, soiree),
  };
}

/** QR de la carte (web ou Wallet) : XOXO-<numéro>-<8 premiers caractères du n° de série>. Accepte aussi le numéro seul saisi à la main. */
export async function chercher(texte: string): Promise<Reponse> {
  await requireScan();
  const admin = createAdminClient();
  const t = texte.trim().toUpperCase();
  const m = /^XOXO-(\d+)-([0-9A-F]{8})$/.exec(t);
  let memberId: string | null = null;
  let manuel = false;
  if (m) {
    const { data: p } = await admin.from("profiles").select("id").eq("member_number", Number(m[1])).maybeSingle();
    if (p) {
      const { data: w } = await admin.from("wallet_passes").select("serial").eq("member_id", p.id).maybeSingle();
      if (w && String(w.serial).slice(0, 8).toUpperCase() === m[2]) memberId = p.id;
    }
  } else if (/^\d{1,6}$/.test(t)) {
    const { data: p } = await admin.from("profiles").select("id").eq("member_number", Number(t)).maybeSingle();
    memberId = p?.id ?? null;
    manuel = true;
  }
  if (!memberId) return { ok: false, message: "Carte inconnue ou invalide." };
  const f = await fiche(memberId);
  return f ? { ok: true, fiche: { ...f, manuel } } : { ok: false, message: "Carte désactivée." };
}

export async function valider(memberId: string, avantage: Avantage): Promise<Reponse> {
  const { user } = await requireScan();
  if (!["coupe_file", "shot", "anniv"].includes(avantage)) return { ok: false, message: "Avantage inconnu." };
  const f = await fiche(memberId);
  if (!f) return { ok: false, message: "Carte désactivée." };
  if (avantage === "anniv" && !f.anniv) return { ok: false, message: "Ce n'est pas son mois d'anniversaire." };
  if (f.deja[avantage]) return { ok: true, fiche: f, message: "Déjà utilisé." };
  const { error } = await createAdminClient().from("fid_usages").insert({ member_id: memberId, soiree_date: soireeDuJour(), avantage, staff_id: user.id });
  const maj = await fiche(memberId);
  if (error) return error.code === "23505" ? { ok: true, fiche: maj!, message: "Déjà utilisé." } : { ok: false, message: "Enregistrement impossible, réessaie." };
  return { ok: true, fiche: maj!, message: avantage === "coupe_file" ? "Coupe-file validé." : avantage === "shot" ? "Shot servi." : "Surprise remise." };
}
