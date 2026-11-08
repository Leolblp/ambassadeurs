"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { telInternational } from "@/lib/whatsapp";
import { age } from "@/lib/fidelite";
import { compteParTel, emailTechnique, envoiAutorise, envoyerCode, essaiAutorise, essaisEffaces } from "@/lib/otp";

export type EtatInscription = { etape: "form" | "code"; tel?: string; erreur?: string; n?: number } | null;

const TROP = "Trop de demandes pour ce numéro. Réessaie dans une heure, ou écris-nous sur Instagram si le code n'arrive pas.";

export async function inscrire(_: EtatInscription, f: FormData): Promise<EtatInscription> {
  const prenom = String(f.get("prenom") ?? "").trim().slice(0, 60);
  const nom = String(f.get("nom") ?? "").trim().slice(0, 60);
  const tel = String(f.get("tel") ?? "").trim().slice(0, 30);
  const naissance = String(f.get("naissance") ?? "").trim();

  if (!prenom || !nom) return { etape: "form", erreur: "Indique ton prénom et ton nom." };
  if (!telInternational(tel)) return { etape: "form", erreur: "Numéro invalide. Exemple : 06 12 34 56 78." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(naissance) || age(naissance) > 100) return { etape: "form", erreur: "Date de naissance invalide." };
  if (age(naissance) < 18) return { etape: "form", erreur: "La carte est réservée aux 18 ans et plus." };
  if (f.get("cgu") !== "on") return { etape: "form", erreur: "Accepte la politique de confidentialité pour continuer." };
  const marketing = f.get("marketing") === "on";

  if (!(await envoiAutorise(tel))) return { etape: "form", erreur: TROP };
  const suite = { etape: "code" as const, tel, n: Date.now() };

  // Numéro déjà connu : on renvoie un code sans dire si une carte existe
  const existant = await compteParTel(tel);
  if (existant) {
    await envoyerCode(existant);
    return suite;
  }

  const admin = createAdminClient();
  const email = emailTechnique(tel);
  const { data: cree, error } = await admin.auth.admin.createUser({
    email, email_confirm: true,
    user_metadata: { first_name: prenom, last_name: nom, phone: tel },
  });
  if (error || !cree.user) {
    if (error?.message.toLowerCase().includes("already")) return suite;
    return { etape: "form", erreur: "Inscription impossible pour le moment. Réessaie dans un instant." };
  }
  // Profil « pending » jusqu'à la vérification du numéro. Index unique : un numéro = un compte
  const { error: errProfil } = await admin.from("profiles").update({ kind: "fidelite", birth_date: naissance, whatsapp_optin: marketing, phone: tel }).eq("id", cree.user.id);
  if (errProfil) {
    await admin.auth.admin.deleteUser(cree.user.id);
    return { etape: "form", erreur: "Inscription impossible pour le moment. Réessaie dans un instant." };
  }
  const ok = await envoyerCode({ id: cree.user.id, email, phone: tel, status: "pending", kind: "fidelite" });
  if (!ok) return { etape: "form", erreur: "Envoi WhatsApp impossible. Vérifie que ce numéro a bien WhatsApp." };
  return suite;
}

export async function renvoyer(_: EtatInscription, f: FormData): Promise<EtatInscription> {
  const tel = String(f.get("tel") ?? "").slice(0, 30);
  if (!(await envoiAutorise(tel))) return { etape: "code", tel, erreur: TROP };
  const c = await compteParTel(tel);
  if (c) await envoyerCode(c);
  return { etape: "code", tel, n: Date.now() };
}

export async function valider(_: EtatInscription, f: FormData): Promise<EtatInscription> {
  const tel = String(f.get("tel") ?? "").slice(0, 30);
  const code = String(f.get("code") ?? "").replace(/\D/g, "");
  if (code.length < 6) return { etape: "code", tel, erreur: "Entre le code reçu sur WhatsApp." };
  const c = await compteParTel(tel);
  if (!c?.email) return { etape: "code", tel, erreur: "Code incorrect ou expiré." };
  if (!(await essaiAutorise(c.id, c.email))) return { etape: "form", erreur: "Trop d'essais. Un nouveau code est nécessaire : réessaie dans 15 minutes.", n: Date.now() };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: c.email, token: code, type: "email" });
  if (error) return { etape: "code", tel, erreur: "Code incorrect ou expiré." };
  await essaisEffaces(c.id);

  const admin = createAdminClient();
  // Numéro vérifié : la carte fidélité est active tout de suite
  if (c.status === "pending" && c.kind === "fidelite") await admin.from("profiles").update({ status: "active" }).eq("id", c.id);
  // Ambassadeur pas encore validé : pas d'accès à l'espace
  if (c.status === "pending" && c.kind !== "fidelite") {
    await supabase.auth.signOut();
    return { etape: "form", erreur: "Ta demande ambassadeur est encore en cours d'étude.", n: Date.now() };
  }
  redirect("/ambassadeurs/carte");
}
