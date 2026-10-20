import { redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";

export type Profil = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  whatsapp_optin: boolean;
  member_number: number | null;
  promo_code: string | null;
  role: "member" | "admin";
  created_at: string;
  team_id: string | null;
};

/** Charge le membre connecté, ou renvoie vers la connexion. */
export async function getMembre() {
  const supabase = await createClient();
  const uid = await getUserId(supabase);
  if (!uid) redirect("/ambassadeurs/connexion");
  const user = { id: uid };

  const { data: profil } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, member_number, promo_code, role, created_at, team_id, phone, whatsapp_optin")
    .eq("id", user.id)
    .single<Profil>();

  if (!profil) redirect("/ambassadeurs/connexion");

  const { data: solde } = await supabase.rpc("member_balance", { p_member: user.id });

  return { supabase, user, profil, solde: (solde as number | null) ?? 0 };
}

export { numero, pts, dateSoiree, dateCourte, PREUVE, RAISON } from "./format";
