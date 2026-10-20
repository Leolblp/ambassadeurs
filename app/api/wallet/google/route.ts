import { NextResponse } from "next/server";
import { createClient, getUserId } from "@/lib/supabase/server";
import { lienGoogle } from "@/lib/wallet/google";

export const runtime = "nodejs";

/** Redirige le membre connecté vers « Ajouter à Google Wallet ». */
export async function GET(request: Request) {
  const uid = await getUserId(await createClient());
  if (!uid) return NextResponse.redirect(new URL("/ambassadeurs/connexion", request.url));
  try {
    return NextResponse.redirect(await lienGoogle(uid));
  } catch (e) {
    console.error("google wallet", e);
    return NextResponse.json({ erreur: "Carte Google indisponible pour le moment." }, { status: 500 });
  }
}
