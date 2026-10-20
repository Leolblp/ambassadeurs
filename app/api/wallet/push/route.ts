import { NextResponse, type NextRequest } from "next/server";
import { bundle, pousserCarte } from "@/lib/wallet";
import { majGoogle } from "@/lib/wallet/google";

export const runtime = "nodejs";

/** Appelé par la base (trigger sur points_ledger) à chaque mouvement de points. */
export async function POST(request: NextRequest) {
  let secret: string;
  try {
    secret = bundle().push;
  } catch {
    return NextResponse.json({ ignore: "wallet non configuré" });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  const { member_id } = (await request.json().catch(() => ({}))) as { member_id?: string };
  if (!member_id) return NextResponse.json({ erreur: "member_id manquant" }, { status: 400 });
  const [apple, google] = await Promise.all([
    pousserCarte(member_id).catch(() => 0),
    majGoogle(member_id).catch(() => false),
  ]);
  return NextResponse.json({ apple, google });
}
