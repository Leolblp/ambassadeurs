import { NextResponse, type NextRequest } from "next/server";
import { bundle, pousserCarte } from "@/lib/wallet";

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
  const envoyes = await pousserCarte(member_id);
  return NextResponse.json({ envoyes });
}
