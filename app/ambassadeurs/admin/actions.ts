"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin, requireStaff, codeDepuisPrenom, codeEquipe } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type Resultat = { ok: boolean; message: string } | null;

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** "2026-10-24T23:00" saisi à l'heure de Lyon -> ISO UTC */
function heureLyon(saisie: string) {
  const d = new Date(saisie + ":00Z");
  const lyon = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(d.getTime() - (lyon.getTime() - utc.getTime())).toISOString();
}

/* ---------- Preuves ---------- */

export async function validerPreuve(id: string): Promise<Resultat> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.rpc("approve_proof", { p_proof: id });
  revalidatePath("/ambassadeurs/admin");
  revalidatePath("/ambassadeurs/equipe");
  return error ? { ok: false, message: "Validation impossible : " + error.message } : { ok: true, message: "Preuve validée, points crédités." };
}

export async function refuserPreuve(id: string, message: string): Promise<Resultat> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.rpc("refuse_proof", { p_proof: id, p_message: message || "Preuve non conforme, renvoie-en une." });
  revalidatePath("/ambassadeurs/admin");
  revalidatePath("/ambassadeurs/equipe");
  return error ? { ok: false, message: "Refus impossible : " + error.message } : { ok: true, message: "Preuve refusée, le membre est prévenu." };
}

/* ---------- Demandes d'accès ---------- */

export async function accepterDemande(id: string): Promise<Resultat> {
  const { supabase, user, isAdmin, team } = await requireStaff();
  const { data: d } = await supabase.from("access_requests").select("*").eq("id", id).single();
  if (!d || d.status !== "pending") return { ok: false, message: "Demande introuvable ou déjà traitée." };
  if (!isAdmin && d.team_id !== team?.id) return { ok: false, message: "Cette demande n'est pas pour ta team." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, message: "Clé secrète Supabase absente sur Vercel (SUPABASE_SECRET_KEY)." };
  }

  // 1. Création du compte + email d'invitation (le profil est créé automatiquement)
  const h = await headers();
  const origine = h.get("host") ? `https://${h.get("host")}` : process.env.NEXT_PUBLIC_SITE_URL;
  const { data: cree, error: errCreation } = await admin.auth.admin.inviteUserByEmail(d.email, {
    data: { first_name: d.first_name, last_name: d.last_name, phone: d.phone, instagram: d.instagram },
    redirectTo: `${origine}/ambassadeurs/auth/bienvenue`,
  });
  if (errCreation || !cree.user) {
    return { ok: false, message: errCreation?.message.toLowerCase().includes("already") ? "Cet email a déjà un compte." : "Création du compte impossible : " + errCreation?.message };
  }

  // 2. Code membre unique
  const base = codeDepuisPrenom(d.first_name);
  let code = base;
  for (let i = 2; i < 50; i++) {
    const { data: pris } = await admin.from("profiles").select("id").eq("promo_code", code).maybeSingle();
    if (!pris) break;
    code = base.replace("-XOXO", `${i}-XOXO`);
  }
  await admin.from("profiles").update({ promo_code: code, team_id: d.team_id ?? null }).eq("id", cree.user.id);

  // 3. Demande marquée acceptée
  await supabase.from("access_requests").update({ status: "accepted", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);

  revalidatePath("/ambassadeurs/admin/demandes");
  revalidatePath("/ambassadeurs/equipe");
  return { ok: true, message: `Bienvenue à ${d.first_name} : code ${code}, invitation envoyée par email.` };
}

export async function refuserDemande(id: string): Promise<Resultat> {
  const { supabase, user } = await requireStaff();
  const { error } = await supabase.from("access_requests").update({ status: "refused", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
  revalidatePath("/ambassadeurs/admin/demandes");
  revalidatePath("/ambassadeurs/equipe");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Demande refusée." };
}

/* ---------- Soirées ---------- */

export async function creerSoiree(_: Resultat, f: FormData): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const nom = txt(f, "name");
  const date = txt(f, "starts_at");
  if (!nom || !date) return { ok: false, message: "Nom et date obligatoires." };
  const { error } = await supabase.from("events").insert({
    name: nom,
    starts_at: heureLyon(date),
    description: txt(f, "description") || null,
    ticket_url: txt(f, "ticket_url") || null,
  });
  revalidatePath("/ambassadeurs/admin/soirees");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Soirée ajoutée." };
}

export async function supprimerSoiree(id: string): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("events").delete().eq("id", id);
  revalidatePath("/ambassadeurs/admin/soirees");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Soirée supprimée." };
}

/* ---------- Missions ---------- */

export async function creerMission(_: Resultat, f: FormData): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const titre = txt(f, "title");
  const points = parseInt(txt(f, "points"), 10);
  if (!titre || !Number.isFinite(points) || points < 0) return { ok: false, message: "Titre et points obligatoires." };
  const echeance = txt(f, "deadline");
  const { error } = await supabase.from("missions").insert({
    title: titre,
    description: txt(f, "description") || null,
    points,
    proof_type: txt(f, "proof_type") || "screenshot",
    deadline: echeance ? heureLyon(echeance) : null,
    event_id: txt(f, "event_id") || null,
  });
  revalidatePath("/ambassadeurs/admin/missions");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Mission publiée. Pense à l'annoncer sur WhatsApp." };
}

export async function basculerMission(id: string, actif: boolean): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("missions").update({ is_active: actif }).eq("id", id);
  revalidatePath("/ambassadeurs/admin/missions");
  return error ? { ok: false, message: error.message } : { ok: true, message: actif ? "Mission réactivée." : "Mission archivée." };
}

/* ---------- Membres ---------- */

export async function ajusterPoints(_: Resultat, f: FormData): Promise<Resultat> {
  const { supabase, user } = await requireAdmin();
  const membre = txt(f, "member_id");
  const delta = parseInt(txt(f, "delta"), 10);
  if (!membre || !Number.isFinite(delta) || delta === 0) return { ok: false, message: "Indique un nombre de points (positif ou négatif)." };
  const { error } = await supabase.from("points_ledger").insert({
    member_id: membre, delta, reason: "adjustment", note: txt(f, "note") || null, created_by: user.id,
  });
  revalidatePath("/ambassadeurs/admin/membres");
  return error ? { ok: false, message: error.message } : { ok: true, message: `${delta > 0 ? "+" : ""}${delta} pts appliqués.` };
}

export async function changerStatutMembre(id: string, statut: "active" | "suspended"): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("profiles").update({ status: statut }).eq("id", id);
  revalidatePath("/ambassadeurs/admin/membres");
  return error ? { ok: false, message: error.message } : { ok: true, message: statut === "active" ? "Membre réactivé." : "Membre suspendu." };
}

export async function changerRole(id: string, role: "member" | "admin"): Promise<Resultat> {
  const { supabase, user } = await requireAdmin();
  if (id === user.id && role === "member") return { ok: false, message: "Tu ne peux pas retirer ton propre accès admin." };
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/ambassadeurs/admin/membres");
  return error ? { ok: false, message: error.message } : { ok: true, message: role === "admin" ? "Accès admin donné." : "Accès admin retiré." };
}

/* ---------- Privilèges ---------- */

export async function remettrePrivilege(id: string): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("redemptions").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", id).eq("status", "requested");
  revalidatePath("/ambassadeurs/admin/privileges");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Privilège marqué comme remis." };
}

export async function annulerPrivilege(id: string): Promise<Resultat> {
  const { supabase, user } = await requireAdmin();
  const { data: r } = await supabase.from("redemptions").select("member_id, cost, status").eq("id", id).single();
  if (!r || r.status !== "requested") return { ok: false, message: "Déjà traité." };
  const { error } = await supabase.from("redemptions").update({ status: "cancelled" }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await supabase.from("points_ledger").insert({ member_id: r.member_id, delta: r.cost, reason: "adjustment", redemption_id: id, note: "Privilège annulé, points rendus", created_by: user.id });
  revalidatePath("/ambassadeurs/admin/privileges");
  return { ok: true, message: "Annulé, points rendus au membre." };
}

/* ---------- Équipes ---------- */

export async function creerEquipe(_: Resultat, f: FormData): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const nom = txt(f, "name");
  const chef = txt(f, "leader_id");
  const bonus = parseInt(txt(f, "bonus_percent") || "10", 10);
  if (!nom) return { ok: false, message: "Nom de l'équipe obligatoire." };
  const { data, error } = await supabase
    .from("teams")
    .insert({ name: nom, leader_id: chef || null, bonus_percent: Number.isFinite(bonus) ? bonus : 10, invite_code: codeEquipe(nom) })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };
  if (chef) await supabase.from("profiles").update({ team_id: data.id }).eq("id", chef);
  revalidatePath("/ambassadeurs/admin/equipes");
  return { ok: true, message: `Équipe « ${nom} » créée.` };
}

export async function modifierEquipe(id: string, _: Resultat, f: FormData): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const chef = txt(f, "leader_id");
  const bonus = parseInt(txt(f, "bonus_percent"), 10);
  const { error } = await supabase.from("teams").update({
    name: txt(f, "name"), leader_id: chef || null, bonus_percent: Number.isFinite(bonus) ? bonus : 10,
  }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  if (chef) await supabase.from("profiles").update({ team_id: id }).eq("id", chef);
  revalidatePath("/ambassadeurs/admin/equipes");
  return { ok: true, message: "Équipe mise à jour." };
}

export async function supprimerEquipe(id: string): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("teams").delete().eq("id", id);
  revalidatePath("/ambassadeurs/admin/equipes");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Équipe supprimée, ses membres sont sans équipe." };
}

export async function affecterEquipe(_: Resultat, f: FormData): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const membre = txt(f, "member_id");
  const equipe = txt(f, "team_id");
  const { error } = await supabase.from("profiles").update({ team_id: equipe || null }).eq("id", membre);
  revalidatePath("/ambassadeurs/admin/membres");
  revalidatePath("/ambassadeurs/admin/equipes");
  return error ? { ok: false, message: error.message } : { ok: true, message: equipe ? "Membre affecté." : "Membre retiré de son équipe." };
}
