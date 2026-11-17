import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Début de la semaine de vente en cours : vendredi 8 h (heure de Paris, à une heure près), comme la bascule de soirée. */
function debutSemaine(maintenant = new Date()) {
  const d = new Date(maintenant.getTime() - 7 * 3600e3);
  const recul = (d.getUTCDay() + 2) % 7; // vendredi = 0
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - recul, 7));
}

/**
 * Billets vendus par un ambassadeur pour la soirée en cours (ou à venir).
 * Si la soirée existe dans le club, on compte les ventes qui lui sont rattachées ; sinon, les ventes depuis vendredi matin.
 */
export async function ventesSoiree(sb: SupabaseClient, memberId: string) {
  const { data: soiree } = await sb.from("events").select("id, name, starts_at").gte("starts_at", new Date(Date.now() - 10 * 3600e3).toISOString()).order("starts_at").limit(1).maybeSingle();
  let q = sb.from("sales").select("ticket_count").eq("member_id", memberId).eq("status", "valid");
  q = soiree ? q.eq("event_id", soiree.id) : q.gte("ordered_at", debutSemaine().toISOString());
  const { data } = await q;
  return { ventes: (data ?? []).reduce((t, l) => t + (Number(l.ticket_count) || 0), 0), soiree: soiree as { id: string; name: string; starts_at: string } | null };
}
