import { requireAdmin } from "@/lib/admin";
import { dateCourte } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerAnnonce } from "../actions";
import { FormAction } from "../ui";

export const dynamic = "force-dynamic";

export default async function Notifications() {
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();
  const [{ data: annonces }, { data: equipes }, { data: regs }, { count: google }] = await Promise.all([
    supabase.from("wallet_annonces").select("id, texte, envoyes, created_at, teams(name)").order("created_at", { ascending: false }).limit(20),
    supabase.from("teams").select("id, name").order("name"),
    admin.from("wallet_registrations").select("serial"),
    admin.from("wallet_passes").select("member_id", { count: "exact", head: true }).eq("google", true),
  ]);
  const apple = new Set((regs ?? []).map((r) => r.serial)).size;

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Notifications Wallet</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Un mot sur leur écran</h1>
        <p style={{ margin: "8px 0 0", color: "var(--gris)", fontSize: 14 }}>
          Cartes installées : {apple} Apple Wallet · {google ?? 0} Google Wallet.
        </p>
      </header>

      <section className="carte" style={{ padding: 20, maxWidth: 640 }}>
        <FormAction action={envoyerAnnonce} bouton="Envoyer la notification">
          <div>
            <label className="champ-label" htmlFor="texte">Message (140 caractères max)</label>
            <textarea className="champ" id="texte" name="texte" rows={3} maxLength={140} required placeholder="Ce soir, coupe-file réservé aux membres jusqu'à minuit." style={{ resize: "vertical" }} />
          </div>
          <div>
            <label className="champ-label" htmlFor="team_id">Destinataires</label>
            <select className="champ" id="team_id" name="team_id" defaultValue="">
              <option value="">Tout le club</option>
              {(equipes ?? []).map((e) => <option key={e.id} value={e.id}>Team {e.name}</option>)}
            </select>
          </div>
        </FormAction>
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
              {dateCourte(a.created_at)} · {(a.teams as unknown as { name: string } | null)?.name ? `Team ${(a.teams as unknown as { name: string }).name}` : "Tout le club"} · {a.envoyes} carte{a.envoyes > 1 ? "s" : ""} prévenue{a.envoyes > 1 ? "s" : ""}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
