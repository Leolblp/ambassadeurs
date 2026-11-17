import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dateSoiree } from "@/lib/format";
import { marquerCodeYurplan } from "./actions";
import { BoutonAction, CopierTexte } from "./ui";

type Soiree = { id: string; name: string; starts_at: string; yurplan_id: number | null; yurplan_codes: string[] | null };

/** Codes ambassadeurs à créer dans Yurplan pour les prochaines soirées (−1 €, tous les tarifs). */
export async function CodesYurplan({ supabase }: { supabase: SupabaseClient }) {
  const depuis = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
  const [{ data: s }, { data: m }] = await Promise.all([
    supabase.from("events").select("id, name, starts_at, yurplan_id, yurplan_codes").gte("starts_at", depuis).order("starts_at").limit(3),
    supabase.from("profiles").select("promo_code, first_name").eq("kind", "ambassadeur").eq("status", "active").not("promo_code", "is", null),
  ]);
  const soirees = (s ?? []) as Soiree[];
  const membres = (m ?? []) as { promo_code: string; first_name: string | null }[];

  const blocs = soirees
    .map((e) => ({ e, manquants: membres.filter((x) => !(e.yurplan_codes ?? []).includes(x.promo_code)) }))
    .filter((b) => b.manquants.length || !b.e.yurplan_id);
  if (!blocs.length) return null;

  return (
    <section className="carte" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 className="label" style={{ margin: 0 }}>Codes à créer dans Yurplan</h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--gris)" }}>
          Dans Yurplan : Nom et Code identiques, réduction <b>Fixe 1 €</b>, s&apos;applique sur <b>Tarif</b>, tout cocher, aucune limite. Puis « C&apos;est fait ».
        </p>
      </div>
      {blocs.map(({ e, manquants }) => (
        <div key={e.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <strong>{e.name} · {dateSoiree(e.starts_at)}</strong>
            {e.yurplan_id && (
              <a className="btn-second" href={`https://pro.yurplan.com/event/${e.yurplan_id}/promotions/new`} target="_blank" rel="noreferrer">Ouvrir Yurplan ↗</a>
            )}
          </div>
          {!e.yurplan_id ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--rouge)" }}>
              ID Yurplan manquant : renseigne-le dans <Link href="/ambassadeurs/admin/soirees">Soirées</Link>.
            </p>
          ) : (
            manquants.map((x) => (
              <div key={x.promo_code} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <code style={{ fontSize: 18, fontWeight: 800, minWidth: 140 }}>{x.promo_code}</code>
                <span style={{ fontSize: 12, color: "var(--gris)" }}>{x.first_name}</span>
                <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
                  <CopierTexte texte={x.promo_code} label="Copier" />
                  <BoutonAction action={marquerCodeYurplan.bind(null, e.id, x.promo_code)} label="C'est fait" variante="vert" />
                </span>
              </div>
            ))
          )}
        </div>
      ))}
    </section>
  );
}
