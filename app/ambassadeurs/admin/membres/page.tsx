import { requireAdmin } from "@/lib/admin";
import { numero, pts } from "@/lib/format";
import Link from "next/link";
import { affecterEquipe, ajusterPoints, changerRole, changerStatutMembre, supprimerMembre } from "../actions";
import { BoutonAction, FormAction } from "../ui";

export default async function Membres({ searchParams }: { searchParams: Promise<{ vue?: string; q?: string }> }) {
  const { supabase, user } = await requireAdmin();
  const { vue, q } = await searchParams;
  const carte = vue === "carte";
  const recherche = (q ?? "").trim().replace(/[%,()]/g, "");
  let requete = supabase.from("profiles").select("id, first_name, last_name, email, phone, instagram, member_number, promo_code, role, status, team_id, kind, birth_date").eq("kind", carte ? "fidelite" : "ambassadeur");
  if (recherche) requete = requete.or(`first_name.ilike.%${recherche}%,last_name.ilike.%${recherche}%,phone.ilike.%${recherche}%,email.ilike.%${recherche}%`);
  const [{ count: nbCarte }, { count: nbAmb }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("kind", "fidelite").eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("kind", "ambassadeur"),
  ]);
  const [{ data: membres }, { data: journal }, { data: ventes }, { data: equipes }] = await Promise.all([
    requete.order("member_number", { ascending: !carte }).limit(carte ? 200 : 1000),
    supabase.from("points_ledger").select("member_id, delta"),
    supabase.from("sales").select("member_id, ticket_count, status"),
    supabase.from("teams").select("id, name, leader_id"),
  ]);
  const nomEquipe = new Map((equipes ?? []).map((t) => [t.id, t.name]));
  const chefs = new Set((equipes ?? []).map((t) => t.leader_id));

  const soldes = new Map<string, number>();
  for (const l of journal ?? []) soldes.set(l.member_id, (soldes.get(l.member_id) ?? 0) + l.delta);
  const billets = new Map<string, number>();
  for (const v of ventes ?? []) if (v.member_id && v.status === "valid") billets.set(v.member_id, (billets.get(v.member_id) ?? 0) + v.ticket_count);

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Membres</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>{carte ? `${nbCarte ?? 0} cartes actives` : `${nbAmb ?? 0} ambassadeurs`}</h1>
        <nav style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <Link href="/ambassadeurs/admin/membres" className="btn" style={{ minHeight: 40, opacity: carte ? 0.5 : 1 }}>Ambassadeurs · {nbAmb ?? 0}</Link>
          <Link href="/ambassadeurs/admin/membres?vue=carte" className="btn" style={{ minHeight: 40, opacity: carte ? 1 : 0.5 }}>Cartes fidélité · {nbCarte ?? 0}</Link>
        </nav>
        <form style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {carte && <input type="hidden" name="vue" value="carte" />}
          <input className="champ" name="q" defaultValue={recherche} placeholder="Nom, téléphone ou email" style={{ flexGrow: 1 }} />
          <button className="btn" type="submit" style={{ minHeight: 48 }}>Chercher</button>
        </form>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(membres ?? []).map((m) => (
          <details key={m.id} className="carte" style={{ borderRadius: 16, padding: "14px 16px", opacity: m.status === "suspended" ? 0.55 : 1 }}>
            <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span>
                <b>N° {numero(m.member_number)} · {m.first_name} {m.last_name}</b>
                {m.role === "admin" && <span className="label" style={{ marginLeft: 8, fontSize: 11 }}>Admin</span>}
                {m.role === "staff" && <span className="label" style={{ marginLeft: 8, fontSize: 11 }}>Scan</span>}
                {m.status === "pending" && <span className="label-gris" style={{ marginLeft: 8 }}>Numéro non vérifié</span>}
                {m.status === "suspended" && <span className="label-gris" style={{ marginLeft: 8 }}>Suspendu</span>}
                <span style={{ display: "block", fontSize: 12, color: "var(--gris)", marginTop: 2 }}>{carte ? `${m.phone ?? "sans téléphone"} · né(e) le ${m.birth_date ? new Date(m.birth_date + "T12:00:00").toLocaleDateString("fr-FR") : "?"}` : <>{m.promo_code ?? "sans code"} · {billets.get(m.id) ?? 0} billets · {m.team_id ? `team ${nomEquipe.get(m.team_id)}` : "sans équipe"}{chefs.has(m.id) ? " (chef)" : ""}</>}</span>
              </span>
              <span className="display" style={{ fontSize: 22 }}>{pts(soldes.get(m.id) ?? 0)} pts</span>
            </summary>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16, marginTop: 14, borderTop: "1px solid var(--bord)" }}>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                {m.email}<br />
                {m.phone || "Pas de téléphone"}<br />
                {m.instagram ? <a href={`https://instagram.com/${m.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">@{m.instagram.replace(/^@/, "")}</a> : "Pas d'Instagram"}
              </div>
              <FormAction action={affecterEquipe} bouton="Affecter">
                <input type="hidden" name="member_id" value={m.id} />
                <div>
                  <label className="champ-label" htmlFor={`t-${m.id}`}>Équipe</label>
                  <select className="champ" id={`t-${m.id}`} name="team_id" defaultValue={m.team_id ?? ""}>
                    <option value="">Sans équipe</option>
                    {(equipes ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </FormAction>
              <FormAction action={ajusterPoints} bouton="Appliquer">
                <input type="hidden" name="member_id" value={m.id} />
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
                  <div><label className="champ-label" htmlFor={`d-${m.id}`}>Points</label><input className="champ" id={`d-${m.id}`} name="delta" type="number" placeholder="+50 ou -50" required /></div>
                  <div><label className="champ-label" htmlFor={`n-${m.id}`}>Raison (visible par le membre)</label><input className="champ" id={`n-${m.id}`} name="note" placeholder="Bonus soirée d'ouverture" /></div>
                </div>
              </FormAction>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {m.role !== "admin" && (
                <BoutonAction
                  action={changerRole.bind(null, m.id, m.role === "staff" ? "member" : "staff")}
                  label={m.role === "staff" ? "Retirer l'accès scan" : "Donner l'accès scan"}
                  confirmer={m.role === "staff" ? undefined : `Donner à ${m.first_name} l'accès à la page scan (porte et bar) ? Aucun accès au back-office.`}
                />
              )}
              <BoutonAction
                action={changerRole.bind(null, m.id, m.role === "admin" ? "member" : "admin")}
                label={m.role === "admin" ? "Retirer l'accès admin" : "Passer admin"}
                confirmer={m.role === "admin" ? `Retirer l'accès back-office à ${m.first_name} ?` : `Donner l'accès au back-office à ${m.first_name} ? Il pourra valider les preuves, accepter des membres et gérer les points.`}
              />
              {m.role !== "admin" && (
                <BoutonAction
                  action={changerStatutMembre.bind(null, m.id, m.status === "active" ? "suspended" : "active")}
                  label={m.status === "active" ? "Suspendre" : "Réactiver"}
                  confirmer={m.status === "active" ? `Suspendre ${m.first_name} ? Il n'apparaîtra plus dans le classement.` : undefined}
                />
              )}
              {m.id !== user.id && (
                <BoutonAction
                  action={supprimerMembre.bind(null, m.id)}
                  label="Supprimer"
                  confirmer={`Supprimer définitivement ${m.first_name} ${m.last_name ?? ""} ? Son compte, ses points, ses preuves et sa carte seront effacés. Impossible à annuler.`}
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
