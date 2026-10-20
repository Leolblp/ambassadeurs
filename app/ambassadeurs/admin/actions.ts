"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin, requireStaff, codeDepuisPrenom, codeEquipe } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { after } from "next/server";
import { envoyerWhatsApp, jourMois, MODELES_META, soumettreModele, statutsModeles, telInternational } from "@/lib/whatsapp";

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

/** Prévient le membre sur WhatsApp, après la réponse (n'allonge pas le clic). */
function notifierPreuve(id: string, valide: boolean, motif?: string) {
  after(async () => {
    const admin = createAdminClient();
    const { data: p } = await admin.from("proofs").select("member_id, missions(title, points), profiles!proofs_member_id_fkey(id, first_name, phone, whatsapp_optin)").eq("id", id).single();
    const m = p?.missions as unknown as { title: string; points: number } | null;
    const membre = p?.profiles as unknown as { id: string; first_name: string | null; phone: string | null; whatsapp_optin: boolean } | null;
    if (!m || !membre) return;
    if (valide) await envoyerWhatsApp(membre, "xoxo_preuve_validee", [membre.first_name || "toi", m.title, m.points]);
    else await envoyerWhatsApp(membre, "xoxo_preuve_refusee", [membre.first_name || "toi", m.title, motif || "preuve non conforme"]);
  });
}

export async function validerPreuve(id: string): Promise<Resultat> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.rpc("approve_proof", { p_proof: id });
  if (!error) notifierPreuve(id, true);
  revalidatePath("/ambassadeurs/admin");
  revalidatePath("/ambassadeurs/equipe");
  return error ? { ok: false, message: "Validation impossible : " + error.message } : { ok: true, message: "Preuve validée, points crédités." };
}

export async function refuserPreuve(id: string, message: string): Promise<Resultat> {
  const { supabase } = await requireStaff();
  const motif = message || "Preuve non conforme, renvoie-en une.";
  const { error } = await supabase.rpc("refuse_proof", { p_proof: id, p_message: motif });
  if (!error) notifierPreuve(id, false, motif);
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

  // 1. Création du compte (le profil est créé automatiquement).
  //    Avec WhatsApp : compte créé sans email, le lien d'activation part sur WhatsApp.
  //    Sans WhatsApp : invitation classique par email.
  const h = await headers();
  const origine = h.get("host") ? `https://${h.get("host")}` : process.env.NEXT_PUBLIC_SITE_URL;
  const metadata = { first_name: d.first_name, last_name: d.last_name, phone: d.phone, instagram: d.instagram };
  const parWhatsApp = !!(d.whatsapp_optin && telInternational(d.phone) && process.env.WHATSAPP_TOKEN);
  const { data: cree, error: errCreation } = parWhatsApp
    ? await admin.auth.admin.createUser({ email: d.email, email_confirm: true, user_metadata: metadata })
    : await admin.auth.admin.inviteUserByEmail(d.email, { data: metadata, redirectTo: `${origine}/ambassadeurs/auth/bienvenue` });
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
  await admin.from("profiles").update({ promo_code: code, team_id: d.team_id ?? null, whatsapp_optin: !!d.whatsapp_optin }).eq("id", cree.user.id);
  let canal = "par email";
  if (parWhatsApp) {
    const { data: lien } = await admin.auth.admin.generateLink({ type: "magiclink", email: d.email });
    const envoye = lien?.properties?.hashed_token
      ? await envoyerWhatsApp({ id: cree.user.id, phone: d.phone, whatsapp_optin: true }, "xoxo_acces_accepte", [d.first_name || "toi"], { bouton: lien.properties.hashed_token })
      : false;
    if (envoye) canal = "sur WhatsApp";
    else await admin.auth.signInWithOtp({ email: d.email, options: { shouldCreateUser: false, emailRedirectTo: `${origine}/ambassadeurs/auth/callback` } });
  }

  // 3. Demande marquée acceptée
  await supabase.from("access_requests").update({ status: "accepted", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);

  revalidatePath("/ambassadeurs/admin/demandes");
  revalidatePath("/ambassadeurs/equipe");
  return { ok: true, message: `Bienvenue à ${d.first_name} : code ${code}, invitation envoyée ${canal}.` };
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

export async function annoncerMission(id: string): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const { data: m } = await supabase.from("missions").select("title, points, deadline, is_active, notified_at").eq("id", id).single();
  if (!m || !m.is_active) return { ok: false, message: "Mission introuvable ou archivée." };
  if (m.notified_at) return { ok: false, message: "Déjà annoncée sur WhatsApp." };
  if (!process.env.WHATSAPP_TOKEN) return { ok: false, message: "WhatsApp n'est pas configuré (WHATSAPP_TOKEN absent sur Vercel)." };
  const admin = createAdminClient();
  const { data: membres } = await admin.from("profiles").select("id, first_name, phone, whatsapp_optin").eq("status", "active").eq("whatsapp_optin", true).not("phone", "is", null);
  await supabase.from("missions").update({ notified_at: new Date().toISOString() }).eq("id", id);
  const liste = membres ?? [];
  after(async () => {
    for (const mb of liste) {
      await envoyerWhatsApp(mb, "xoxo_mission_ajoutee", [mb.first_name || "toi", m.title, m.deadline ? jourMois(m.deadline) : "fin de semaine"]);
    }
  });
  revalidatePath("/ambassadeurs/admin/missions");
  return { ok: true, message: `Annonce en cours d'envoi à ${liste.length} membre${liste.length > 1 ? "s" : ""}.` };
}

export async function publierModele(index: number): Promise<Resultat> {
  const { supabase } = await requireAdmin();
  const { MODELES_MISSIONS } = await import("@/lib/modeles");
  const m = MODELES_MISSIONS[index];
  if (!m) return { ok: false, message: "Modèle introuvable." };
  const { data: soiree } = await supabase.from("events").select("id, starts_at").gte("starts_at", new Date().toISOString()).order("starts_at").limit(1).maybeSingle();
  const { error } = await supabase.from("missions").insert({
    title: m.title, description: m.description, points: m.points, proof_type: m.proof_type,
    event_id: soiree?.id ?? null, deadline: soiree ? new Date(new Date(soiree.starts_at).getTime() + m.delai_h * 3600000).toISOString() : null,
  });
  revalidatePath("/ambassadeurs/admin/missions");
  return error ? { ok: false, message: error.message } : { ok: true, message: soiree ? "Publiée, liée à la prochaine soirée." : "Publiée (aucune soirée à venir à lier)." };
}

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

/* ---------- WhatsApp ---------- */

export async function soumettreModeles(): Promise<Resultat> {
  await requireAdmin();
  const statuts = await statutsModeles();
  if (!statuts.ok) return { ok: false, message: statuts.erreur };
  const existants = new Set(statuts.liste.map((t) => t.name));
  const aSoumettre = MODELES_META.filter((m) => !existants.has(m.name));
  if (!aSoumettre.length) return { ok: true, message: "Tous les modèles sont déjà soumis." };
  const erreurs: string[] = [];
  for (const m of aSoumettre) {
    const e = await soumettreModele(m);
    if (e) erreurs.push(`${m.name} : ${e}`);
  }
  revalidatePath("/ambassadeurs/admin/whatsapp");
  return erreurs.length ? { ok: false, message: erreurs.join(" · ") } : { ok: true, message: `${aSoumettre.length} modèle(s) soumis à Meta.` };
}

export async function envoyerTest(): Promise<Resultat> {
  const { supabase, user } = await requireAdmin();
  const { data: p } = await supabase.from("profiles").select("id, first_name, phone").eq("id", user.id).single();
  if (!p?.phone) return { ok: false, message: "Ajoute ton numéro dans Ma carte d'abord." };
  const ok = await envoyerWhatsApp({ ...p, whatsapp_optin: true }, "xoxo_preuve_validee", [p.first_name || "toi", "Message de test", 0]);
  revalidatePath("/ambassadeurs/admin/whatsapp");
  return ok ? { ok: true, message: "Message de test envoyé sur ton WhatsApp." } : { ok: false, message: "Échec de l'envoi, voir le journal ci-dessous." };
}

/* ---------- Notifications Wallet ---------- */

export async function envoyerAnnonce(_: Resultat, f: FormData): Promise<Resultat> {
  const { user } = await requireAdmin();
  const texte = txt(f, "texte");
  const mode = txt(f, "mode") || "tous";
  if (!texte) return { ok: false, message: "Écris un message." };
  if (texte.length > 140) return { ok: false, message: "140 caractères maximum." };
  const admin = createAdminClient();

  let membres: string[] | undefined;
  let cible = "Tout le club";
  let team: string | null = null;
  if (mode === "team") {
    team = txt(f, "team_id") || null;
    if (!team) return { ok: false, message: "Choisis une team." };
    const [{ data }, { data: t }] = await Promise.all([
      admin.from("profiles").select("id").eq("team_id", team).eq("status", "active"),
      admin.from("teams").select("name").eq("id", team).single(),
    ]);
    membres = (data ?? []).map((m) => m.id);
    cible = `Team ${t?.name ?? ""}`;
  } else if (mode === "membres") {
    membres = f.getAll("membres").map(String).filter(Boolean);
    if (!membres.length) return { ok: false, message: "Choisis au moins un membre." };
    cible = `${membres.length} membre${membres.length > 1 ? "s" : ""} choisi${membres.length > 1 ? "s" : ""}`;
  } else if (mode === "points") {
    const min = txt(f, "min") === "" ? -Infinity : Number(txt(f, "min"));
    const max = txt(f, "max") === "" ? Infinity : Number(txt(f, "max"));
    const [{ data: actifs }, { data: lignes }] = await Promise.all([
      admin.from("profiles").select("id").eq("status", "active"),
      admin.from("points_ledger").select("member_id, delta"),
    ]);
    const soldes = new Map<string, number>();
    for (const l of lignes ?? []) soldes.set(l.member_id, (soldes.get(l.member_id) ?? 0) + Number(l.delta));
    membres = (actifs ?? []).map((m) => m.id).filter((id) => {
      const s = soldes.get(id) ?? 0;
      return s >= min && s <= max;
    });
    cible = `Solde ${Number.isFinite(min) ? `≥ ${min}` : ""}${Number.isFinite(min) && Number.isFinite(max) ? " et " : ""}${Number.isFinite(max) ? `≤ ${max}` : ""} pts`.replace("Solde  pts", "Tous les soldes");
  }
  if (membres && !membres.length) return { ok: false, message: "Aucun membre ne correspond à ce ciblage." };

  const { data: annonce, error } = await admin.from("wallet_annonces")
    .insert({ texte, team_id: team, membres: membres ?? null, cible, created_by: user.id }).select("id").single();
  if (error || !annonce) return { ok: false, message: "Envoi impossible : " + error?.message };
  after(async () => {
    const { pousserToutesLesCartes } = await import("@/lib/wallet");
    const { annonceGoogle } = await import("@/lib/wallet/google");
    const [apple, google] = await Promise.all([pousserToutesLesCartes(membres).catch(() => 0), annonceGoogle(texte, membres).catch(() => 0)]);
    await admin.from("wallet_annonces").update({ envoyes: apple + google }).eq("id", annonce.id);
  });
  revalidatePath("/ambassadeurs/admin/notifications");
  return { ok: true, message: `Envoi en cours : ${cible}.` };
}

/* ---------- Suppression d'un membre ---------- */

export async function supprimerMembre(id: string): Promise<Resultat> {
  const { user } = await requireAdmin();
  if (id === user.id) return { ok: false, message: "Tu ne peux pas supprimer ton propre compte." };
  const admin = createAdminClient();
  const { data: m } = await admin.from("profiles").select("first_name, email").eq("id", id).single();
  if (!m) return { ok: false, message: "Membre introuvable." };

  // 1. Fichiers de preuve
  const { data: fichiers } = await admin.storage.from("proofs").list(id, { limit: 1000 });
  if (fichiers?.length) await admin.storage.from("proofs").remove(fichiers.map((f) => `${id}/${f.name}`));

  // 2. Références laissées par ce compte (s'il a validé des preuves ou ajusté des points)
  await Promise.all([
    admin.from("points_ledger").update({ created_by: null }).eq("created_by", id),
    admin.from("proofs").update({ reviewed_by: null }).eq("reviewed_by", id),
    admin.from("access_requests").update({ reviewed_by: null }).eq("reviewed_by", id),
  ]);
  if (m.email) await admin.from("access_requests").delete().eq("email", m.email);

  // 3. Compte : supprime aussi profil, points, preuves, privilèges, carte Wallet (cascade)
  const { error } = await admin.auth.admin.deleteUser(id);
  revalidatePath("/ambassadeurs/admin/membres");
  return error ? { ok: false, message: "Suppression impossible : " + error.message } : { ok: true, message: `${m.first_name ?? "Le membre"} a été supprimé.` };
}
