import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Lien d'activation reçu sur WhatsApp (bouton « Activer mon accès »). */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const t = searchParams.get("t");
  if (t) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: t });
    if (!error) return NextResponse.redirect(`${origin}/ambassadeurs`);
  }
  return NextResponse.redirect(`${origin}/ambassadeurs/connexion?erreur=lien`);
}
