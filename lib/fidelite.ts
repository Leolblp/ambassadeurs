import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Avantage = "coupe_file" | "shot" | "anniv";

export const AVANTAGES: Record<Avantage, { titre: string; detail: string }> = {
  coupe_file: { titre: "Coupe-file", detail: "Tu passes devant la file, à chaque soirée." },
  shot: { titre: "1 shot offert", detail: "Au bar, à chaque soirée." },
  anniv: { titre: "Surprise d'anniversaire", detail: "Une fois pendant ton mois d'anniversaire." },
};

/** Date de la soirée en cours, heure de Paris. Bascule à 8 h : 2 h du matin vendredi = soirée du jeudi. */
export function soireeDuJour(maintenant = new Date()) {
  const decale = new Date(maintenant.getTime() - 8 * 3600 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(decale);
}

/** Vrai si la soirée tombe dans le mois de naissance du membre. */
export function moisAnniv(naissance: string | null | undefined, soiree = soireeDuJour()) {
  if (!naissance) return false;
  return naissance.slice(5, 7) === soiree.slice(5, 7);
}

/** Âge à une date donnée (AAAA-MM-JJ). */
export function age(naissance: string, a = soireeDuJour()) {
  const [an, mo, jo] = naissance.split("-").map(Number);
  const [ya, ym, yj] = a.split("-").map(Number);
  return ya - an - (ym < mo || (ym === mo && yj < jo) ? 1 : 0);
}

/** Avantages déjà utilisés : ce soir (coupe-file, shot) et cette année (anniversaire). */
export async function utilisations(memberId: string, soiree = soireeDuJour()) {
  const { data } = await createAdminClient()
    .from("fid_usages")
    .select("avantage, soiree_date, created_at")
    .eq("member_id", memberId)
    .gte("soiree_date", `${soiree.slice(0, 4)}-01-01`);
  const lignes = data ?? [];
  return {
    coupe_file: lignes.find((l) => l.avantage === "coupe_file" && l.soiree_date === soiree)?.created_at as string | undefined,
    shot: lignes.find((l) => l.avantage === "shot" && l.soiree_date === soiree)?.created_at as string | undefined,
    anniv: lignes.find((l) => l.avantage === "anniv")?.created_at as string | undefined,
  };
}

export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
