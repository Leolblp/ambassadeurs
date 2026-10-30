import { requireAdmin } from "@/lib/admin";
import { pts } from "@/lib/format";
import { basculerPrivilege, creerPrivilege, modifierPrivilege, supprimerPrivilege } from "../actions";
import { BoutonAction, FormAction } from "../ui";

export const dynamic = "force-dynamic";

type Priv = { id: string; name: string; description: string | null; cost: number; stock: number | null; is_active: boolean; sort_order: number };

function Champs({ p }: { p?: Priv }) {
  const id = p?.id ?? "nouveau";
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 10 }}>
        <div><label className="champ-label" htmlFor={`n-${id}`}>Nom</label><input className="champ" id={`n-${id}`} name="name" required defaultValue={p?.name} placeholder="Coupe-file" /></div>
        <div><label className="champ-label" htmlFor={`c-${id}`}>Coût (points)</label><input className="champ" id={`c-${id}`} name="cost" type="number" min={1} step={10} required defaultValue={p?.cost ?? 200} /></div>
      </div>
      <div><label className="champ-label" htmlFor={`d-${id}`}>Description (visible par les membres)</label><input className="champ" id={`d-${id}`} name="description" defaultValue={p?.description ?? ""} placeholder="Entrée prioritaire pour toi et un invité" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <div><label className="champ-label" htmlFor={`s-${id}`}>Stock restant (vide = illimité)</label><input className="champ" id={`s-${id}`} name="stock" type="number" min={0} defaultValue={p?.stock ?? ""} placeholder="Illimité" /></div>
        <div><label className="champ-label" htmlFor={`o-${id}`}>Ordre d&apos;affichage</label><input className="champ" id={`o-${id}`} name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} /></div>
      </div>
    </>
  );
}

export default async function Catalogue() {
  const { supabase } = await requireAdmin();
  const [{ data: privileges }, { data: deblocages }] = await Promise.all([
    supabase.from("privileges").select("id, name, description, cost, stock, is_active, sort_order").order("sort_order").order("cost"),
    supabase.from("redemptions").select("privilege_id, status"),
  ]);
  const stats = new Map<string, { attente: number; remis: number }>();
  for (const r of deblocages ?? []) {
    const s = stats.get(r.privilege_id) ?? { attente: 0, remis: 0 };
    if (r.status === "requested") s.attente++;
    if (r.status === "delivered") s.remis++;
    stats.set(r.privilege_id, s);
  }

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Catalogue des privilèges</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Ce que le club offre</h1>
        <p style={{ margin: "8px 0 0", color: "var(--gris)", fontSize: 14 }}>Les membres voient les privilèges actifs, du moins cher au plus cher. Le stock baisse à chaque déblocage et remonte si tu annules.</p>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {((privileges ?? []) as Priv[]).map((p) => {
          const s = stats.get(p.id) ?? { attente: 0, remis: 0 };
          const epuise = p.stock !== null && p.stock <= 0;
          return (
            <details key={p.id} className="carte" style={{ borderRadius: 16, padding: "14px 16px", opacity: p.is_active ? 1 : 0.55 }}>
              <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span>
                  <b>{p.name}</b>
                  {!p.is_active && <span className="label-gris" style={{ marginLeft: 8 }}>Masqué</span>}
                  {p.is_active && epuise && <span className="label" style={{ marginLeft: 8, fontSize: 11 }}>Épuisé</span>}
                  <span style={{ display: "block", fontSize: 12, color: "var(--gris)", marginTop: 2 }}>
                    Stock : {p.stock === null ? "illimité" : p.stock} · {s.attente} à remettre · {s.remis} remis
                  </span>
                </span>
                <span className="display" style={{ fontSize: 22 }}>{pts(p.cost)} pts</span>
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 16, marginTop: 14, borderTop: "1px solid var(--bord)" }}>
                <FormAction action={modifierPrivilege.bind(null, p.id)} bouton="Enregistrer">
                  <Champs p={p} />
                </FormAction>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <BoutonAction action={basculerPrivilege.bind(null, p.id, !p.is_active)} label={p.is_active ? "Masquer aux membres" : "Rendre visible"} />
                  <BoutonAction action={supprimerPrivilege.bind(null, p.id)} label="Supprimer" confirmer={`Supprimer « ${p.name} » du catalogue ?`} />
                </div>
              </div>
            </details>
          );
        })}
      </section>

      <section className="carte" style={{ padding: 20, maxWidth: 640 }}>
        <h2 className="label" style={{ margin: "0 0 14px" }}>Nouveau privilège</h2>
        <FormAction action={creerPrivilege} bouton="Ajouter au catalogue">
          <Champs />
        </FormAction>
      </section>
    </>
  );
}
