import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tâche quotidienne (Vercel Cron, 3h UTC) : supprime les fichiers de preuve
 * 5 jours après la soirée liée à la mission. Sans soirée liée : 5 jours après
 * la validation ou le refus. Les preuves en attente ne sont jamais supprimées.
 * La ligne de preuve et les points restent dans l'historique.
 */
const JOURS = 5;

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("proofs")
    .select("id, file_path, reviewed_at, missions(events(starts_at))")
    .not("file_path", "is", null)
    .in("status", ["approved", "refused"])
    .limit(1000);
  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

  const limite = Date.now() - JOURS * 24 * 3600 * 1000;
  const aSupprimer = (data ?? []).filter((p) => {
    const soiree = (p.missions as unknown as { events: { starts_at: string } | null } | null)?.events?.starts_at;
    const reference = soiree ?? p.reviewed_at;
    return reference && new Date(reference).getTime() < limite;
  });

  let supprimes = 0;
  for (let i = 0; i < aSupprimer.length; i += 100) {
    const lot = aSupprimer.slice(i, i + 100);
    const { error: errStockage } = await admin.storage.from("proofs").remove(lot.map((p) => p.file_path as string));
    if (errStockage) continue;
    await admin.from("proofs").update({ file_path: null, file_deleted_at: new Date().toISOString() }).in("id", lot.map((p) => p.id));
    supprimes += lot.length;
  }

  return NextResponse.json({ verifies: data?.length ?? 0, supprimes });
}
