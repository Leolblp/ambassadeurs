import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Lien reçu par email (connexion ou invitation).
 * Fonctionne même si le lien est ouvert sur un autre appareil que celui
 * qui a demandé la connexion.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}/ambassadeurs${type === "invite" ? "/carte" : ""}`);
  }

  return NextResponse.redirect(`${origin}/ambassadeurs/connexion?erreur=lien`);
}
