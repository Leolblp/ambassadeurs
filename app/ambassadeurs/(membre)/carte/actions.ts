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
