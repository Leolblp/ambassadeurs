import { NextResponse } from "next/server";
import { createClient, getUserId } from "@/lib/supabase/server";
import { genererPass } from "@/lib/wallet";

export const runtime = "nodejs";

/** Téléchargement de la carte Apple Wallet du membre connecté. */
export async function GET(request: Request) {
  const uid = await getUserId(await createClient());
  if (!uid) return NextResponse.redirect(new URL("/ambassadeurs/connexion", request.url));
  try {
    const fichier = await genererPass(uid);
    return new NextResponse(new Uint8Array(fichier), {
      headers: { "Content-Type": "application/vnd.apple.pkpass", "Content-Disposition": 'attachment; filename="xoxo-club.pkpass"', "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("wallet", e);
    return NextResponse.json({ erreur: "Carte indisponible pour le moment." }, { status: 500 });
  }
}
