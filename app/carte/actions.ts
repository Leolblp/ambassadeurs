"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { envoyerWhatsApp, telInternational } from "@/lib/whatsapp";
import { age } from "@/lib/fidelite";

export type EtatInscription = { etape: "form" | "code"; tel?: string; erreur?: string; deja?: boolean } | null;

type Compte = { id: string; email: string | null; phone: string | null; status: string; kind: string };

/** Retrouve un compte (actif ou en cours d'inscription) à partir du numéro. */
async function compteParTel(tel: string): Promise<Compte | null> {
  const cible = telInternational(tel);
  if (!cible) return null;
  const { data } = await createAdminClient().from("profiles").select("id, email, phone, status, kind").neq("status", "suspended").not("phone", "is", null);
  return ((data ?? []) as Compte[]).find((p) => telInternational(p.phone) === cible) ?? null;
}

/** Envoie le code de connexion sur WhatsApp (au plus un toutes les 45 s). */
async function envoyerCode(c: Compte) {
  const admin = createAdminClient();
  const { data: recent } = await admin.from("whatsapp_log").select("id").eq("member_id", c.id).eq("template", "xoxo_code")
    .gte("created_at", new Date(Date.now() - 45 * 1000).toISOString()).limit(1);
  if (recent?.length) return true;
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: c.email! });
  const code = data?.properties?.email_otp;
  if (error || !code) return false;
  return envoyerWhatsApp({ id: c.id, phone: c.phone, whatsapp_optin: true }, "xoxo_code", [code], { bouton: code });
}

export async function inscrire(_: EtatInscription, f: FormData): Promise<EtatInscription> {
  const prenom = String(f.get("prenom") ?? "").trim().slice(0, 60);
  const nom = String(f.get("nom") ?? "").trim().slice(0, 60);
  const email = String(f.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const tel = String(f.get("tel") ?? "").trim();
  const naissance = String(f.get("naissance") ?? "").trim();

  if (!prenom || !nom) return { etape: "form", erreur: "Indique ton prénom et ton nom." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { etape: "form", erreur: "Email invalide." };
  if (!telInternational(tel)) return { etape: "form", erreur: "Numéro invalide. Exemple : 06 12 34 56 78." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(naissance) || age(naissance) > 100) return { etape: "form", erreur: "Date de naissance invalide." };
  if (age(naissance) < 18) return { etape: "form", erreur: "La carte est réservée aux 18 ans et plus." };
  if (f.get("cgu") !== "on") return { etape: "form", erreur: "Accepte les conditions pour continuer." };

  // Numéro déjà connu : on renvoie simplement un code (carte existante ou inscription pas terminée)
  const existant = await compteParTel(tel);
  if (existant?.email) {
    const ok = await envoyerCode(existant);
    if (!ok) return { etape: "form", erreur: "Envoi WhatsApp impossible pour le moment. Réessaie dans une minute." };
    return { etape: "code", tel, deja: existant.status === "active" };
  }

  const admin = createAdminClient();
  const { data: cree, error } = await admin.auth.admin.createUser({
    email, email_confirm: true,
    user_metadata: { first_name: prenom, last_name: nom, phone: tel },
  });
  if (error || !cree.user) {
    if (error?.message.toLowerCase().includes("already")) return { etape: "form", erreur: "Cet email est déjà utilisé avec un autre numéro. Connecte-toi avec ton numéro habituel." };
    return { etape: "form", erreur: "Inscription impossible pour le moment. Réessaie dans un instant." };
  }
  // Le profil est créé « pending » : il devient actif quand le numéro est vérifié
  await admin.from("profiles").update({ kind: "fidelite", birth_date: naissance, whatsapp_optin: true, phone: tel }).eq("id", cree.user.id);
  const ok = await envoyerCode({ id: cree.user.id, email, phone: tel, status: "pending", kind: "fidelite" });
  if (!ok) return { etape: "form", erreur: "Envoi WhatsApp impossible. Vérifie que ce numéro a bien WhatsApp." };
  return { etape: "code", tel };
}

export async function renvoyer(_: EtatInscription, f: FormData): Promise<EtatInscription> {
  const tel = String(f.get("tel") ?? "");
  const c = await compteParTel(tel);
  if (c?.email) await envoyerCode(c);
  return { etape: "code", tel };
}

export async function valider(_: EtatInscription, f: FormData): Promise<EtatInscription> {
  const tel = String(f.get("tel") ?? "");
  const code = String(f.get("code") ?? "").replace(/\D/g, "");
  if (code.length < 6) return { etape: "code", tel, erreur: "Entre le code reçu sur WhatsApp." };
  const c = await compteParTel(tel);
  if (!c?.email) return { etape: "code", tel, erreur: "Code incorrect ou expiré." };

  const admin = createAdminClient();
  const depuis = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await admin.from("login_attempts").select("id", { count: "exact", head: true }).eq("member_id", c.id).gte("created_at", depuis);
  if ((count ?? 0) >= 5) return { etape: "form", erreur: "Trop d'essais. Réessaie dans 15 minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: c.email, token: code, type: "email" });
  if (error) {
    await admin.from("login_attempts").insert({ member_id: c.id });
    if ((count ?? 0) + 1 >= 5) await admin.auth.admin.generateLink({ type: "magiclink", email: c.email });
    return { etape: "code", tel, erreur: "Code incorrect ou expiré." };
  }
  await admin.from("login_attempts").delete().eq("member_id", c.id);
  // Numéro vérifié : la carte fidélité est active tout de suite
  if (c.status === "pending" && c.kind === "fidelite") await admin.from("profiles").update({ status: "active" }).eq("id", c.id);
  // Ambassadeur pas encore validé : pas d'accès à l'espace
  if (c.status === "pending" && c.kind !== "fidelite") {
    await supabase.auth.signOut();
    return { etape: "form", erreur: "Ta demande ambassadeur est encore en cours d'étude." };
  }
  redirect("/ambassadeurs/carte");
}
