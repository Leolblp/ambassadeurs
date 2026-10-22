import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin";
import { dateCourte } from "@/lib/format";
import { cleWebhook } from "@/lib/ventes";
import { associerEvenement, importerVentes, reglerPointsParBillet } from "../actions";
import { CopierTexte, FormAction } from "../ui";
import ImportFichier from "./ImportFichier";

export const dynamic = "force-dynamic";

export default async function Ventes() {
  const { supabase } = await requireAdmin();
  const h = await headers();
  const site = h.get("host") ? `https://${h.get("host")}` : "https://lacom.club";
  const urlWebhook = `${site}/api/yurplan?k=${cleWebhook()}`;

  const [{ data: reglages }, { data: ventes }, { data: soirees }, { data: journal }, { data: profils }] = await Promise.all([
    supabase.from("app_settings").select("points_per_ticket").eq("id", 1).single(),
    supabase.from("sales").select("member_id, event_id, yurplan_event, ticket_count, status, ordered_at").eq("status", "valid"),
    supabase.from("events").select("id, name, starts_at, yurplan_event").order("starts_at", { ascending: false }).limit(20),
    supabase.from("yurplan_webhooks").select("id, trigger, resultat, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("id, first_name, last_name, member_number"),
  ]);
  const nom = new Map((profils ?? []).map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name?.[0] ? p.last_name[0] + "." : ""}`.trim()]));
  const nonAssocies = [...new Set((ventes ?? []).filter((v) => !v.event_id && v.yurplan_event).map((v) => v.yurplan_event as string))];

  // Classement des vendeurs pour chaque soirée récente
  const parSoiree = (soirees ?? []).slice(0, 4).map((s) => {
    const compte = new Map<string, number>();
    for (const v of ventes ?? []) if (v.event_id === s.id && v.member_id) compte.set(v.member_id, (compte.get(v.member_id) ?? 0) + v.ticket_count);
    const total = [...compte.values()].reduce((a, b) => a + b, 0);
    return { s, total, top: [...compte.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10) };
  });

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Ventes Yurplan</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Chaque billet compte</h1>
        <p style={{ margin: "8px 0 0", color: "var(--gris)", fontSize: 14 }}>Les billets achetés avec un code membre créditent automatiquement le membre (et le bonus de son chef d&apos;équipe).</p>
      </header>

      <section className="carte" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 className="label" style={{ margin: 0 }}>En direct : webhook Yurplan</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--gris)", lineHeight: 1.55 }}>
          Dans Yurplan, pour chaque événement : Gérer mes applications &gt; Développeur &gt; Webhooks. Colle cette URL et coche « Commande validée » et « Élément de commande annulé ».
        </p>
        <code style={{ fontSize: 12, wordBreak: "break-all", padding: 10, border: "1px solid var(--bord)", borderRadius: 10 }}>{urlWebhook}</code>
        <div><CopierTexte texte={urlWebhook} label="Copier l'URL" /></div>
        {(journal ?? []).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
            <span className="label-gris">Derniers appels reçus</span>
            {(journal ?? []).map((j) => (
              <div key={j.id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{j.trigger ?? "?"} · {j.resultat ?? "en cours"}</span>
                <span style={{ color: "var(--gris)" }}>{dateCourte(j.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="carte" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
        <h2 className="label" style={{ margin: 0 }}>Import manuel : fichier d&apos;export</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--gris)", lineHeight: 1.55 }}>
          Le jeudi soir, exporte les commandes ou les participants depuis Yurplan (.csv ou .xlsx) et dépose le fichier ici. Tu peux réimporter le même fichier sans risque : une commande n&apos;est jamais comptée deux fois.
        </p>
        <ImportFichier action={importerVentes} />
      </section>

      <section className="carte" style={{ padding: 20, maxWidth: 640 }}>
        <h2 className="label" style={{ margin: "0 0 12px" }}>Points par billet</h2>
        <FormAction action={reglerPointsParBillet} bouton="Enregistrer">
          <div style={{ maxWidth: 200 }}><label className="champ-label" htmlFor="points">Points crédités par billet</label><input className="champ" id="points" name="points" type="number" min={0} step={10} defaultValue={reglages?.points_per_ticket ?? 0} /></div>
        </FormAction>
      </section>

      {nonAssocies.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 className="label" style={{ margin: 0 }}>Événements Yurplan à associer à une soirée</h2>
          {nonAssocies.map((n) => (
            <div key={n} className="carte" style={{ padding: 16, borderRadius: 14 }}>
              <FormAction action={associerEvenement.bind(null, n)} bouton="Associer">
                <div><label className="champ-label">« {n} »</label>
                  <select className="champ" name="event_id" defaultValue="">
                    <option value="">Choisir la soirée</option>
                    {(soirees ?? []).map((s) => <option key={s.id} value={s.id}>{s.name} · {dateCourte(s.starts_at)}</option>)}
                  </select>
                </div>
              </FormAction>
            </div>
          ))}
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 className="label" style={{ margin: 0 }}>Ventes par soirée</h2>
        {parSoiree.map(({ s, total, top }) => (
          <details key={s.id} className="carte" style={{ borderRadius: 14, padding: "12px 16px" }}>
            <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span><b>{s.name}</b> <span style={{ color: "var(--gris)", fontSize: 13 }}>· {dateCourte(s.starts_at)}</span></span>
              <span style={{ fontWeight: 800 }}>{total} billet{total > 1 ? "s" : ""}</span>
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
              {top.length === 0 && <span style={{ fontSize: 13, color: "var(--gris)" }}>Aucune vente avec code membre.</span>}
              {top.map(([id, n], i) => (
                <div key={id} style={{ fontSize: 14, display: "flex", justifyContent: "space-between" }}>
                  <span>{i + 1}. {nom.get(id) ?? "Membre"}</span><b>{n}</b>
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>
    </>
  );
}
