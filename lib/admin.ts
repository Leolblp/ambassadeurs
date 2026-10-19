import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Vérifie que l'utilisateur connecté est admin, sinon renvoie vers l'espace membre. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ambassadeurs/connexion");
  const { data: profil } = await supabase.from("profiles").select("role, first_name").eq("id", user.id).single();
  if (profil?.role !== "admin") redirect("/ambassadeurs");
  return { supabase, user, profil };
}

/** "Léa" -> "LEA-XOXO" (sans accents ni espaces) */
export function codeDepuisPrenom(prenom: string) {
  const base = prenom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 10) || "MEMBRE";
  return `${base}-XOXO`;
}
