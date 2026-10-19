import { getMembre, pts } from "@/lib/membre";
import ListePrivileges from "./ListePrivileges";

export default async function Privileges() {
  const { supabase, user, solde } = await getMembre();

  const [{ data: privileges }, { data: echanges }] = await Promise.all([
    supabase.from("privileges").select("id, name, description, cost, stock").eq("is_active", true).order("sort_order").order("cost"),
    supabase.from("redemptions").select("id, status, created_at, privileges(name)").eq("member_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div className="ecran" style={{ gap: 6, minHeight: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, paddingBottom: 12 }}>
        <div>
          <p className="label" style={{ margin: 0 }}>Privilèges</p>
          <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 34, lineHeight: 1.05 }}>Réservés aux membres.</h1>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>{pts(solde)}</div>
          <div className="label-gris">pts dispo</div>
        </div>
      </div>

      <ListePrivileges privileges={privileges ?? []} solde={solde} />

      {(echanges ?? []).length > 0 && (
        <section style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className="label" style={{ margin: 0 }}>Tes privilèges</h2>
          {(echanges ?? []).map((e) => {
            const nom = (e.privileges as unknown as { name: string } | null)?.name ?? "Privilège";
            const statut = e.status === "delivered" ? "Remis" : e.status === "cancelled" ? "Annulé" : "À récupérer auprès de l'équipe";
            return (
              <div key={e.id} className="carte" style={{ borderRadius: 14, padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
                <span style={{ fontWeight: 700 }}>{nom}</span>
                <span style={{ color: e.status === "requested" ? "var(--ambre)" : "var(--gris)", fontSize: 12, textAlign: "right" }}>{statut}</span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
