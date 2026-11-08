import { NextResponse } from "next/server";
import { createClient, getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lienGoogle } from "@/lib/wallet/google";

export const runtime = "nodejs";

/** Redirige le membre connecté vers « Ajouter à Google Wallet ». */
export async function GET(request: Request) {
  const uid = await getUserId(await createClient());
  if (!uid) return NextResponse.redirect(new URL("/ambassadeurs/connexion", request.url));
  const { data: profil } = await createAdminClient().from("profiles").select("status").eq("id", uid).maybeSingle();
  if (profil?.status !== "active") return NextResponse.redirect(new URL("/ambassadeurs/auth/sortie", request.url));
  try {
    return NextResponse.redirect(await lienGoogle(uid));
  } catch (e) {
    console.error("google wallet", e);
    return NextResponse.json({ erreur: "Carte Google indisponible pour le moment." }, { status: 500 });
  }
}
