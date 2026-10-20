import { requireAdmin } from "@/lib/admin";
import { dateCourte } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import FormAnnonce, { type MembreCible } from "./FormAnnonce";

export const dynamic = "force-dynamic";

export default async function Notifications() {
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();
  const [{ data: annonces }, { data: equipes }, { data: regs }, { data: passes }, { data: profils }, { data: lignes }] = await Promise.all([
    supabase.from("wallet_annonces").select("id, texte, envoyes, created_at, cible").order("created_at", { ascending: false }).limit(20),
    supabase.from("teams").select("id, name").order("name"),
    admin.from("wallet_registrations").select("serial"),
    admin.from("wallet_passes").select("member_id, serial, google"),
    admin.from("profiles").select("id, first_name, last_name, member_number, team_id").eq("status", "active").order("first_name"),
    admin.from("points_ledger").select("member_id, delta"),
  ]);
  const seriesApple = new Set((regs ?? []).map((r) => r.serial));
  const apple = seriesApple.size;
  const google = (passes ?? []).filter((p) => p.google).length;
  const aCarte = new Set((passes ?? []).filter((p) => p.google || seriesApple.has(p.serial)).map((p) => p.member_id));
  const soldes = new Map<string, number>();
  for (const l of lignes ?? []) soldes.set(l.member_id, (soldes.get(l.member_id) ?? 0) + Number(l.delta));
  const membres: MembreCible[] = (profils ?? []).map((p) => ({
    id: p.id,
    nom: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Membre",
    numero: String(p.member_number ?? 0).padStart(3, "0"),
    team_id: p.team_id,
    points: soldes.get(p.id) ?? 0,
    carte: aCarte.has(p.id),
  }));

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Notifications Wallet</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Un mot sur leur écran</h1>
        <p style={{ margin: "8px 0 0", color: "var(--gris)", fontSize: 14 }}>
          Cartes installées : {apple} Apple Wallet · {google} Google Wallet.
        </p>
      </header>

      <section className="carte" style={{ padding: 20, maxWidth: 640 }}>
        <FormAnnonce membres={membres} equipes={equipes ?? []} />
        <p style={{ margin: "14px 0 0", fontSize: 12, color: "var(--gris)", lineHeight: 1.5 }}>
          Le message apparaît en notification sur l&apos;écran du téléphone et reste au dos de la carte pendant 7 jours.
          Reste rare : 1 à 2 messages par semaine, sinon les membres coupent les notifications. Google limite à 3 notifications par jour et par carte.
        </p>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 className="label" style={{ margin: 0 }}>Derniers messages</h2>
        {(annonces ?? []).length === 0 && <p className="carte" style={{ margin: 0, padding: 14, color: "var(--gris)", fontSize: 14 }}>Aucun message envoyé.</p>}
        {(annonces ?? []).map((a) => (
          <div key={a.id} className="carte" style={{ borderRadius: 12, padding: "12px 14px", fontSize: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            <div>{a.texte}</div>
            <div style={{ fontSize: 12, color: "var(--gris)" }}>
              {dateCourte(a.created_at)} · {a.cible ?? "Tout le club"} · {a.envoyes} carte{a.envoyes > 1 ? "s" : ""} prévenue{a.envoyes > 1 ? "s" : ""}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
