import { requireAdmin } from "@/lib/admin";
import { dateCourte } from "@/lib/format";
import { accepterDemande, refuserDemande } from "../actions";
import { BoutonAction } from "../ui";

export default async function Demandes() {
  const { supabase } = await requireAdmin();
  const [{ data: attente }, { data: traitees }] = await Promise.all([
    supabase.from("access_requests").select("*").eq("status", "pending").order("created_at"),
    supabase.from("access_requests").select("id, first_name, last_name, status, reviewed_at").neq("status", "pending").order("reviewed_at", { ascending: false }).limit(15),
  ]);

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Demandes d&apos;accès</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Qui entre dans le club ?</h1>
      </header>

      {(attente ?? []).length === 0 ? (
        <p className="carte" style={{ padding: 32, textAlign: "center", color: "var(--gris)" }}>Aucune demande en attente.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {(attente ?? []).map((d) => {
            const insta = d.instagram?.replace(/^@/, "");
            return (
              <article key={d.id} className="carte" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 400, textTransform: "uppercase" }}>{d.first_name} {d.last_name}</h2>
                  <div style={{ fontSize: 12, color: "var(--gris)", marginTop: 4 }}>Reçue {dateCourte(d.created_at)}</div>
                </div>
                <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "90px 1fr", gap: "6px 10px", fontSize: 14 }}>
                  <dt className="label-gris" style={{ paddingTop: 3 }}>Instagram</dt>
                  <dd style={{ margin: 0 }}>{insta ? <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer">@{insta}</a> : "—"}</dd>
                  <dt className="label-gris" style={{ paddingTop: 3 }}>Email</dt>
                  <dd style={{ margin: 0, wordBreak: "break-all" }}>{d.email}</dd>
                  <dt className="label-gris" style={{ paddingTop: 3 }}>Tél.</dt>
                  <dd style={{ margin: 0 }}>{d.phone || "—"}</dd>
                </dl>
                {d.motivation && <p style={{ margin: 0, padding: 12, borderRadius: 10, background: "#1c1010", fontSize: 14, lineHeight: 1.5 }}>« {d.motivation} »</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <BoutonAction action={accepterDemande.bind(null, d.id)} label="Accepter" variante="vert" />
                  <BoutonAction action={refuserDemande.bind(null, d.id)} label="Refuser" confirmer={`Refuser la demande de ${d.first_name} ?`} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {(traitees ?? []).length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className="label" style={{ margin: 0 }}>Dernières décisions</h2>
          {(traitees ?? []).map((t) => (
            <div key={t.id} className="carte" style={{ borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span>{t.first_name} {t.last_name}</span>
              <span style={{ color: t.status === "accepted" ? "var(--vert)" : "var(--gris)", fontSize: 12, fontWeight: 700 }}>{t.status === "accepted" ? "Acceptée" : "Refusée"}</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
