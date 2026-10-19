import { requireAdmin } from "@/lib/admin";
import { dateCourte, numero } from "@/lib/format";
import { annulerPrivilege, remettrePrivilege } from "../actions";
import { BoutonAction } from "../ui";

type Ligne = {
  id: string; cost: number; created_at: string;
  privileges: { name: string } | null;
  profiles: { first_name: string | null; last_name: string | null; member_number: number | null } | null;
};

export default async function PrivilegesARemettre() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("redemptions")
    .select("id, cost, created_at, privileges(name), profiles(first_name, last_name, member_number)")
    .eq("status", "requested")
    .order("created_at");
  const lignes = (data ?? []) as unknown as Ligne[];

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Privilèges à remettre</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Ce que le club doit</h1>
      </header>

      {lignes.length === 0 ? (
        <p className="carte" style={{ padding: 32, textAlign: "center", color: "var(--gris)" }}>Aucun privilège en attente.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lignes.map((r) => (
            <article key={r.id} className="carte" style={{ borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div className="display" style={{ fontSize: 20, textTransform: "uppercase" }}>{r.privileges?.name}</div>
                <div style={{ fontSize: 13, color: "var(--gris)", marginTop: 2 }}>
                  {r.profiles?.first_name} {r.profiles?.last_name} · N° {numero(r.profiles?.member_number)} · {r.cost} pts · {dateCourte(r.created_at)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <BoutonAction action={remettrePrivilege.bind(null, r.id)} label="Remis" variante="vert" />
                <BoutonAction action={annulerPrivilege.bind(null, r.id)} label="Annuler" confirmer="Annuler et rendre les points au membre ?" />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
