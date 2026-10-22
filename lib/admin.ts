import { redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";

/** Vérifie que l'utilisateur connecté est admin, sinon renvoie vers l'espace membre. */
export async function requireAdmin() {
  const supabase = await createClient();
  const uid = await getUserId(supabase);
  if (!uid) redirect("/ambassadeurs/connexion");
  const user = { id: uid };
  const { data: profil } = await supabase.from("profiles").select("role, first_name").eq("id", user.id).single();
  if (profil?.role !== "admin") redirect("/ambassadeurs");
  return { supabase, user, profil };
}

/** Admin ou chef d'équipe. Renvoie aussi la team dirigée, s'il y en a une. */
export async function requireStaff() {
  const supabase = await createClient();
  const uid = await getUserId(supabase);
  if (!uid) redirect("/ambassadeurs/connexion");
  const user = { id: uid };
  const [{ data: profil }, { data: team }] = await Promise.all([
    supabase.from("profiles").select("role, first_name").eq("id", user.id).single(),
    supabase.from("teams").select("id, name, invite_code, bonus_percent").eq("leader_id", user.id).maybeSingle(),
  ]);
  const isAdmin = profil?.role === "admin";
  if (!isAdmin && !team) redirect("/ambassadeurs");
  return { supabase, user, isAdmin, team };
}

/** "Les Noctambules" -> "NOCTAMBU" + 3 chiffres */
export function codeEquipe(nom: string) {
  const base = nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 8) || "TEAM";
  return base + String(Math.floor(100 + Math.random() * 900));
}

/** "Léa" -> "LEAXOXO" (majuscules et chiffres seulement : format des codes promo Yurplan) */
export function codeDepuisPrenom(prenom: string) {
  const base = prenom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 10) || "MEMBRE";
  return `${base}XOXO`;
}
