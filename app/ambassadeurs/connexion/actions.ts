"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { telInternational } from "@/lib/whatsapp";
import { compteParTel, envoiAutorise, envoyerCode, essaiAutorise, essaisEffaces } from "@/lib/otp";

export type EtatCode = { etape: "tel" | "code"; tel?: string; erreur?: string } | null;

export async function demanderCode(_: EtatCode, f: FormData): Promise<EtatCode> {
  const tel = String(f.get("tel") ?? "").trim();
  if (!telInternational(tel)) return { etape: "tel", erreur: "Numéro invalide. Exemple : 06 12 34 56 78." };
  if (!(await envoiAutorise(tel))) return { etape: "tel", erreur: "Trop de demandes. Réessaie dans une heure." };
  const m = await compteParTel(tel);
  // Réponse identique que le numéro soit membre ou non (on ne révèle rien).
  // Carte fidélité pas encore vérifiée : le code l'active aussi. Ambassadeur en attente : rien.
  if (!m?.email || (m.status === "pending" && m.kind !== "fidelite")) return { etape: "code", tel };
  await envoyerCode(m);
  return { etape: "code", tel };
}

export async function verifierCode(_: EtatCode, f: FormData): Promise<EtatCode> {
  const tel = String(f.get("tel") ?? "");
  const code = String(f.get("code") ?? "").replace(/\D/g, "");
  if (code.length < 6) return { etape: "code", tel, erreur: "Entre le code reçu sur WhatsApp." };
  const m = await compteParTel(tel);
  if (!m?.email || (m.status === "pending" && m.kind !== "fidelite")) return { etape: "code", tel, erreur: "Code incorrect ou expiré." };
  if (!(await essaiAutorise(m.id, m.email))) return { etape: "tel", erreur: "Trop d'essais. Réessaie dans 15 minutes." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: m.email, token: code, type: "email" });
  if (error) return { etape: "code", tel, erreur: "Code incorrect ou expiré." };
  await essaisEffaces(m.id);
  if (m.status === "pending") await createAdminClient().from("profiles").update({ status: "active" }).eq("id", m.id);
  redirect("/ambassadeurs");
}
