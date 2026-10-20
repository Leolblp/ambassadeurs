import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { genererPass, PASS_TYPE } from "@/lib/wallet";

export const runtime = "nodejs";

/**
 * Web service Apple Wallet (https://developer.apple.com/documentation/walletpasses)
 *  POST/DELETE devices/{device}/registrations/{passType}/{serial}
 *  GET         devices/{device}/registrations/{passType}?passesUpdatedSince=…
 *  GET         passes/{passType}/{serial}
 *  POST        log
 */
type Ctx = { params: Promise<{ chemin: string[] }> };

async function membreAutorise(request: NextRequest, serial: string) {
  const jeton = request.headers.get("authorization")?.replace(/^ApplePass\s+/i, "");
  if (!jeton) return null;
  const { data } = await createAdminClient().from("wallet_passes").select("member_id, serial, updated_at").eq("serial", serial).eq("auth_token", jeton).maybeSingle();
  return data;
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const c = (await params).chemin;
  if (c[0] === "log") return new NextResponse(null, { status: 200 });
  if (c[0] !== "devices" || c[2] !== "registrations" || c[3] !== PASS_TYPE || !c[4]) return new NextResponse(null, { status: 404 });
  const carte = await membreAutorise(request, c[4]);
  if (!carte) return new NextResponse(null, { status: 401 });
  const { pushToken } = (await request.json().catch(() => ({}))) as { pushToken?: string };
  if (!pushToken) return new NextResponse(null, { status: 400 });
  const admin = createAdminClient();
  const { data: existe } = await admin.from("wallet_registrations").select("device_id").eq("device_id", c[1]).eq("serial", c[4]).maybeSingle();
  await admin.from("wallet_registrations").upsert({ device_id: c[1], serial: c[4], push_token: pushToken });
  return new NextResponse(null, { status: existe ? 200 : 201 });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const c = (await params).chemin;
  if (c[0] !== "devices" || c[2] !== "registrations" || !c[4]) return new NextResponse(null, { status: 404 });
  const carte = await membreAutorise(request, c[4]);
  if (!carte) return new NextResponse(null, { status: 401 });
  await createAdminClient().from("wallet_registrations").delete().eq("device_id", c[1]).eq("serial", c[4]);
  return new NextResponse(null, { status: 200 });
}

export async function GET(request: NextRequest, { params }: Ctx) {
  const c = (await params).chemin;

  // Liste des cartes modifiées pour un appareil
  if (c[0] === "devices" && c[2] === "registrations") {
    const admin = createAdminClient();
    const { data: regs } = await admin.from("wallet_registrations").select("serial").eq("device_id", c[1]);
    if (!regs?.length) return new NextResponse(null, { status: 204 });
    let q = admin.from("wallet_passes").select("serial, updated_at").in("serial", regs.map((r) => r.serial));
    const depuis = request.nextUrl.searchParams.get("passesUpdatedSince");
    if (depuis && !Number.isNaN(Date.parse(depuis))) q = q.gt("updated_at", depuis);
    const { data: cartes } = await q;
    if (!cartes?.length) return new NextResponse(null, { status: 204 });
    const dernier = cartes.map((x) => x.updated_at).sort().at(-1);
    return NextResponse.json({ serialNumbers: cartes.map((x) => x.serial), lastUpdated: dernier });
  }

  // Dernière version d'une carte
  if (c[0] === "passes" && c[1] === PASS_TYPE && c[2]) {
    const carte = await membreAutorise(request, c[2]);
    if (!carte) return new NextResponse(null, { status: 401 });
    const fichier = await genererPass(carte.member_id);
    return new NextResponse(new Uint8Array(fichier), {
      headers: { "Content-Type": "application/vnd.apple.pkpass", "Last-Modified": new Date(carte.updated_at).toUTCString(), "Cache-Control": "no-store" },
    });
  }

  return new NextResponse(null, { status: 404 });
}
