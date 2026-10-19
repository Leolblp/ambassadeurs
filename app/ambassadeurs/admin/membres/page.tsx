import { requireAdmin } from "@/lib/admin";
import { numero, pts } from "@/lib/format";
import { ajusterPoints, changerRole, changerStatutMembre } from "../actions";
import { BoutonAction, FormAction } from "../ui";

export default async function Membres() {
  const { supabase } = await requireAdmin();
  const [{ data: membres }, { data: journal }, { data: ventes }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, email, phone, instagram, member_number, promo_code, role, status").order("member_number"),
    supabase.from("points_ledger").select("member_id, delta"),
    supabase.from("sales").select("member_id, ticket_count, status"),
  ]);

  const soldes = new Map<string, number>();
  for (const l of journal ?? []) soldes.set(l.member_id, (soldes.get(l.member_id) ?? 0) + l.delta);
  const billets = new Map<string, number>();
  for (const v of ventes ?? []) if (v.member_id && v.status === "valid") billets.set(v.member_id, (billets.get(v.member_id) ?? 0) + v.ticket_count);

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Membres</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>{(membres ?? []).filter((m) => m.role === "member").length} membres</h1>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(membres ?? []).map((m) => (
          <details key={m.id} className="carte" style={{ borderRadius: 16, padding: "14px 16px", opacity: m.status === "suspended" ? 0.55 : 1 }}>
            <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span>
                <b>N° {numero(m.member_number)} · {m.first_name} {m.last_name}</b>
                {m.role === "admin" && <span className="label" style={{ marginLeft: 8, fontSize: 9 }}>Admin</span>}
                {m.status === "suspended" && <span className="label-gris" style={{ marginLeft: 8 }}>Suspendu</span>}
                <span style={{ display: "block", fontSize: 12, color: "var(--gris)", marginTop: 2 }}>{m.promo_code ?? "sans code"} · {billets.get(m.id) ?? 0} billets</span>
              </span>
              <span className="display" style={{ fontSize: 22 }}>{pts(soldes.get(m.id) ?? 0)} pts</span>
            </summary>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16, marginTop: 14, borderTop: "1px solid var(--bord)" }}>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                {m.email}<br />
                {m.phone || "Pas de téléphone"}<br />
                {m.instagram ? <a href={`https://instagram.com/${m.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">@{m.instagram.replace(/^@/, "")}</a> : "Pas d'Instagram"}
              </div>
              <FormAction action={ajusterPoints} bouton="Appliquer">
                <input type="hidden" name="member_id" value={m.id} />
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
                  <div><label className="champ-label" htmlFor={`d-${m.id}`}>Points</label><input className="champ" id={`d-${m.id}`} name="delta" type="number" placeholder="+50 ou -50" required /></div>
                  <div><label className="champ-label" htmlFor={`n-${m.id}`}>Raison (visible par le membre)</label><input className="champ" id={`n-${m.id}`} name="note" placeholder="Bonus soirée d'ouverture" /></div>
                </div>
              </FormAction>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <BoutonAction
                action={changerRole.bind(null, m.id, m.role === "admin" ? "member" : "admin")}
                label={m.role === "admin" ? "Retirer l'accès admin" : "Passer admin"}
                confirmer={m.role === "admin" ? `Retirer l'accès back-office à ${m.first_name} ?` : `Donner l'accès au back-office à ${m.first_name} ? Il pourra valider les preuves, accepter des membres et gérer les points.`}
              />
              {m.role === "member" && (
                <BoutonAction
                  action={changerStatutMembre.bind(null, m.id, m.status === "active" ? "suspended" : "active")}
                  label={m.status === "active" ? "Suspendre" : "Réactiver"}
                  confirmer={m.status === "active" ? `Suspendre ${m.first_name} ? Il n'apparaîtra plus dans le classement.` : undefined}
                />
              )}
              </div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
