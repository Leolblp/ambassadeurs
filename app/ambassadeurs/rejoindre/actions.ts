"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { telInternational } from "@/lib/whatsapp";
import { compteParTel, emailTechnique, envoiAutorise } from "@/lib/otp";

export type EtatDemande = { ok: boolean; message?: string } | null;

/** Demande d'accès ambassadeur. Aucun email : tout le suivi se fait sur WhatsApp. */
export async function demanderAcces(_: EtatDemande, f: FormData): Promise<EtatDemande> {
  const prenom = String(f.get("prenom") ?? "").trim().slice(0, 60);
  const nom = String(f.get("nom") ?? "").trim().slice(0, 60);
  const tel = String(f.get("tel") ?? "").trim().slice(0, 30);
  const insta = String(f.get("insta") ?? "").trim().slice(0, 60);
  if (!prenom || !nom || !insta) return { ok: false, message: "Remplis prénom, nom et Instagram." };
  if (!telInternational(tel)) return { ok: false, message: "Numéro invalide. Exemple : 06 12 34 56 78." };
  if (f.get("cgu") !== "on") return { ok: false, message: "Accepte les conditions pour continuer." };
  if (!(await envoiAutorise(tel))) return { ok: false, message: "Trop de demandes. Réessaie dans une heure." };

  const admin = createAdminClient();
  const email = emailTechnique(tel);
  const deja = await compteParTel(tel);
  // Déjà une carte : la demande reprend l'adresse du compte pour que l'acceptation le retrouve
  const { data: enCours } = await admin.from("access_requests").select("id").eq("phone", tel).eq("status", "pending").limit(1);
  if (enCours?.length) return { ok: true };
  const codeTeam = String(f.get("team") ?? "").trim().toUpperCase().slice(0, 20) || null;
  const { error } = await admin.from("access_requests").insert({
    first_name: prenom, last_name: nom, email: deja?.email ?? email, phone: tel, whatsapp_optin: true,
    instagram: insta, motivation: String(f.get("why") ?? "").trim().slice(0, 1000) || null, team_code: codeTeam,
  });
  return error ? { ok: false, message: "L'envoi n'a pas abouti. Réessaie dans un instant." } : { ok: true };
}
