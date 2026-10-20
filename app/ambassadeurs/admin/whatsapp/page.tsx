import { requireAdmin } from "@/lib/admin";
import { dateCourte } from "@/lib/format";
import { MODELES_META, statutsModeles } from "@/lib/whatsapp";
import { envoyerTest, soumettreModeles } from "../actions";
import { BoutonAction } from "../ui";

export const dynamic = "force-dynamic";

const STATUT: Record<string, { label: string; couleur: string }> = {
  APPROVED: { label: "Approuvé", couleur: "var(--vert)" },
  PENDING: { label: "En cours de validation", couleur: "var(--ambre)" },
  REJECTED: { label: "Refusé", couleur: "var(--rouge)" },
};

export default async function WhatsApp() {
  const { supabase } = await requireAdmin();
  const [statuts, { data: journal }, { count: inscrits }] = await Promise.all([
    statutsModeles(),
    supabase.from("whatsapp_log").select("id, template, ok, error, created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("whatsapp_optin", true).eq("status", "active"),
  ]);
  const parNom = new Map(statuts.ok ? statuts.liste.map((t) => [t.name, t]) : []);

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>WhatsApp</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Le fil direct</h1>
        <p style={{ margin: "8px 0 0", color: "var(--gris)", fontSize: 14 }}>{inscrits ?? 0} membre{(inscrits ?? 0) > 1 ? "s" : ""} actif{(inscrits ?? 0) > 1 ? "s" : ""} avec les notifications activées.</p>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 className="label" style={{ margin: 0 }}>Modèles de messages</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <BoutonAction action={soumettreModeles} label="Soumettre à Meta" variante="plein" />
            <BoutonAction action={envoyerTest} label="M'envoyer un test" />
          </div>
        </div>
        {!statuts.ok && <p className="carte" style={{ margin: 0, padding: 14, color: "var(--rouge)", fontSize: 14 }}>{statuts.erreur}</p>}
        {MODELES_META.map((m) => {
          const t = parNom.get(m.name);
          const s = t ? STATUT[t.status] ?? { label: t.status, couleur: "var(--gris)" } : { label: "Non soumis", couleur: "var(--gris)" };
          return (
            <article key={m.name} className="carte" style={{ borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <code style={{ fontSize: 13 }}>{m.name}</code>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.couleur }}>{s.label}{t?.category && t.category !== "UTILITY" ? ` · ${t.category}` : ""}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--gris)" }}>{m.texte}</div>
              {t?.rejected_reason && t.rejected_reason !== "NONE" && <div style={{ fontSize: 12, color: "var(--rouge)" }}>Motif : {t.rejected_reason}</div>}
            </article>
          );
        })}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 className="label" style={{ margin: 0 }}>Derniers envois</h2>
        {(journal ?? []).length === 0 && <p className="carte" style={{ margin: 0, padding: 14, color: "var(--gris)", fontSize: 14 }}>Aucun envoi pour l&apos;instant.</p>}
        {(journal ?? []).map((j) => (
          <div key={j.id} className="carte" style={{ borderRadius: 12, padding: "10px 14px", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span><b style={{ color: j.ok ? "var(--vert)" : "var(--rouge)" }}>{j.ok ? "Envoyé" : "Échec"}</b> · {j.template}</span>
              <span style={{ color: "var(--gris)" }}>{dateCourte(j.created_at)}</span>
            </div>
            {j.error && <div style={{ color: "var(--gris)", wordBreak: "break-word" }}>{j.error}</div>}
          </div>
        ))}
      </section>
    </>
  );
}
