import { redirect } from "next/navigation";
import { getMembre } from "@/lib/membre";
import Demande from "./Demande";

export default async function DevenirAmbassadeur() {
  const { supabase, profil } = await getMembre({ carte: true });
  if (profil.kind !== "fidelite") redirect("/ambassadeurs");
  const [{ data: privileges }, { data: reglages }] = await Promise.all([
    supabase.from("privileges").select("name, cost").eq("is_active", true).order("cost").limit(6),
    supabase.from("app_settings").select("points_per_ticket").single(),
  ]);
  return (
    <div className="ecran" style={{ gap: 20, minHeight: "auto" }}>
      <div>
        <p className="label" style={{ margin: 0 }}>Programme ambassadeur</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 34, lineHeight: 1.05 }}>Fais vivre les nuits de La Commerciale.</h1>
      </div>
      <p style={{ margin: 0, color: "var(--gris)", lineHeight: 1.6 }}>
        Tu as un code à ton nom. Chaque billet vendu avec ton code te rapporte {reglages?.points_per_ticket ?? ""} points, à échanger contre des privilèges. Tu gardes tous les avantages de ta carte.
      </p>
      {(privileges ?? []).length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className="label" style={{ margin: 0 }}>Les privilèges</h2>
          {(privileges ?? []).map((p) => (
            <div key={p.name} className="avantage">
              <span className="display" style={{ fontSize: 18, color: "var(--rouge)", minWidth: 56 }}>{p.cost}</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</span>
            </div>
          ))}
        </section>
      )}
      <Demande />
    </div>
  );
}
