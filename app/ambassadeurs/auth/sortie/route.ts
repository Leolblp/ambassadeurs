import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Déconnexion dans un Route Handler : ici les cookies de session peuvent réellement être effacés. */
export async function GET(request: NextRequest) {
  await (await createClient()).auth.signOut();
  return NextResponse.redirect(new URL("/ambassadeurs/connexion", request.url));
}
