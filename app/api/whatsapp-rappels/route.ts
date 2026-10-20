import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerWhatsApp, jourMois } from "@/lib/whatsapp";

export const maxDuration = 60;

/**
 * Tâche quotidienne (Vercel Cron, 15h UTC) :
 * 1. rappel aux membres qui n'ont pas envoyé de preuve pour une mission qui se termine dans les 30 h ;
 * 2. alerte aux chefs d'équipe qui ont des preuves de leur team en attente.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  }
  if (!process.env.WHATSAPP_TOKEN) return NextResponse.json({ ignore: "WhatsApp non configuré" });

  const admin = createAdminClient();
  const maintenant = new Date();
  const horizon = new Date(maintenant.getTime() + 30 * 3600 * 1000);

  const [{ data: missions }, { data: membres }] = await Promise.all([
    admin.from("missions").select("id, title, deadline").eq("is_active", true).neq("proof_type", "tickets")
      .gt("deadline", maintenant.toISOString()).lte("deadline", horizon.toISOString()),
    admin.from("profiles").select("id, first_name, phone, whatsapp_optin, team_id").eq("status", "active"),
  ]);

  let rappels = 0;
  const actifs = (membres ?? []).filter((m) => m.whatsapp_optin && m.phone);
  for (const mission of missions ?? []) {
    const { data: faites } = await admin.from("proofs").select("member_id").eq("mission_id", mission.id).in("status", ["pending", "approved"]);
    const dejaFait = new Set((faites ?? []).map((p) => p.member_id));
    for (const m of actifs) {
      if (dejaFait.has(m.id)) continue;
      if (await envoyerWhatsApp(m, "xoxo_rappel_mission", [m.first_name || "toi", jourMois(mission.deadline as string), mission.title])) rappels++;
    }
  }

  // Chefs d'équipe : preuves de leur team en attente
  let alertes = 0;
  const { data: equipes } = await admin.from("teams").select("id, leader_id").not("leader_id", "is", null);
  const { data: enAttente } = await admin.from("proofs").select("member_id").eq("status", "pending");
  const equipeDe = new Map((membres ?? []).map((m) => [m.id, m.team_id]));
  for (const e of equipes ?? []) {
    const n = (enAttente ?? []).filter((p) => equipeDe.get(p.member_id) === e.id && p.member_id !== e.leader_id).length;
    const chef = (membres ?? []).find((m) => m.id === e.leader_id);
    if (n > 0 && chef && (await envoyerWhatsApp(chef, "xoxo_preuves_team", [chef.first_name || "toi", n]))) alertes++;
  }

  return NextResponse.json({ rappels, alertes });
}
