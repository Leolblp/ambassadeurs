"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { telInternational } from "@/lib/whatsapp";

export type EtatWhatsApp = { ok: boolean; message: string } | null;

export async function reglerWhatsApp(_: EtatWhatsApp, f: FormData): Promise<EtatWhatsApp> {
  const uid = await getUserId(await createClient());
  if (!uid) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const tel = String(f.get("tel") ?? "").trim();
  const optin = f.get("whatsapp") === "on";
  if (optin && !telInternational(tel)) return { ok: false, message: "Numéro invalide. Exemple : 06 12 34 56 78." };
  const { error } = await createAdminClient().from("profiles").update({ phone: tel || null, whatsapp_optin: optin }).eq("id", uid);
  revalidatePath("/ambassadeurs/carte");
  return error ? { ok: false, message: "Enregistrement impossible, réessaie." } : { ok: true, message: optin ? "Notifications WhatsApp activées." : "Notifications WhatsApp désactivées." };
}

/** Date de naissance : enregistrée une seule fois (elle débloque la surprise d'anniversaire). */
export async function enregistrerNaissance(_: EtatWhatsApp, f: FormData): Promise<EtatWhatsApp> {
  const uid = await getUserId(await createClient());
  if (!uid) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const naissance = String(f.get("naissance") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(naissance) || naissance < "1920-01-01" || naissance > new Date().toISOString().slice(0, 10)) return { ok: false, message: "Date invalide." };
  const { error } = await createAdminClient().from("profiles").update({ birth_date: naissance }).eq("id", uid).is("birth_date", null);
  revalidatePath("/ambassadeurs/carte");
  return error ? { ok: false, message: "Enregistrement impossible, réessaie." } : { ok: true, message: "Date enregistrée." };
}

/** Membre carte qui veut devenir ambassadeur : crée une demande d'accès étudiée par l'équipe. */
export async function demanderAmbassadeur(_: EtatWhatsApp, f: FormData): Promise<EtatWhatsApp> {
  const uid = await getUserId(await createClient());
  if (!uid) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("first_name, last_name, email, phone, whatsapp_optin, kind").eq("id", uid).single();
  if (!p || p.kind !== "fidelite") return { ok: false, message: "Tu es déjà ambassadeur." };
  const { data: deja } = await admin.from("access_requests").select("id").eq("email", p.email).eq("status", "pending").limit(1);
  if (deja?.length) return { ok: true, message: "Ta demande est déjà en cours d'étude." };
  const insta = String(f.get("insta") ?? "").trim().slice(0, 60);
  if (!insta) return { ok: false, message: "Indique ton Instagram." };
  const { error } = await admin.from("access_requests").insert({
    first_name: p.first_name, last_name: p.last_name, email: p.email, phone: p.phone, whatsapp_optin: !!p.whatsapp_optin,
    instagram: insta, motivation: String(f.get("why") ?? "").trim().slice(0, 1000) || null,
  });
  return error ? { ok: false, message: "Envoi impossible, réessaie." } : { ok: true, message: "Demande envoyée. Réponse sur WhatsApp sous 72 h." };
}
