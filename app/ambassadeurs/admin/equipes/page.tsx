import { requireAdmin } from "@/lib/admin";
import { pts } from "@/lib/format";
import { creerEquipe, modifierEquipe, supprimerEquipe } from "../actions";
import { BoutonAction, CopierTexte, FormAction } from "../ui";

export default async function Equipes() {
  const { supabase } = await requireAdmin();
  const [{ data: equipes }, { data: membres }, { data: classement }] = await Promise.all([
    supabase.from("teams").select("*").order("created_at"),
    supabase.from("profiles").select("id, first_name, last_name, member_number, team_id").eq("status", "active").order("first_name"),
    supabase.rpc("leaderboard_teams_month"),
  ]);
  const stats = new Map(((classement ?? []) as { team_id: string; members: number; points: number; rank: number }[]).map((c) => [c.team_id, c]));
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://lacom.club";

  const OptionsChefs = () => (
    <>
      <option value="">Aucun pour l&apos;instant</option>
      {(membres ?? []).map((m) => (
        <option key={m.id} value={m.id}>
          {m.first_name} {m.last_name}
        </option>
      ))}
    </>
  );

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Équipes</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Les teams du club</h1>
      </header>

      <section className="carte" style={{ padding: 20, maxWidth: 640 }}>
        <h2 className="label" style={{ margin: "0 0 14px" }}>Nouvelle équipe</h2>
        <FormAction action={creerEquipe} bouton="Créer l'équipe">
          <div><label className="champ-label" htmlFor="name">Nom de l&apos;équipe</label><input className="champ" id="name" name="name" required placeholder="Les Noctambules" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
            <div>
              <label className="champ-label" htmlFor="leader_id">Chef d&apos;équipe</label>
              <select className="champ" id="leader_id" name="leader_id" defaultValue=""><OptionsChefs /></select>
            </div>
            <div><label className="champ-label" htmlFor="bonus_percent">Bonus %</label><input className="champ" id="bonus_percent" name="bonus_percent" type="number" min={0} max={100} defaultValue={10} /></div>
          </div>
        </FormAction>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {(equipes ?? []).map((t) => {
          const s = stats.get(t.id);
          const lien = `${site}/ambassadeurs/rejoindre?team=${t.invite_code}`;
          return (
            <article key={t.id} className="carte" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 400, textTransform: "uppercase" }}>{t.name}</h2>
                {s && <span className="display" style={{ fontSize: 22, color: "var(--rouge)" }}>#{s.rank}</span>}
              </div>
              <div style={{ fontSize: 13, color: "var(--gris)" }}>{s?.members ?? 0} membres · {pts(s?.points ?? 0)} pts ce mois · code {t.invite_code}</div>
              <div><CopierTexte texte={lien} label="Copier le lien de recrutement" /></div>

              <details>
                <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Modifier</summary>
                <div style={{ paddingTop: 12 }}>
                  <FormAction action={modifierEquipe.bind(null, t.id)} bouton="Enregistrer">
                    <div><label className="champ-label" htmlFor={`n-${t.id}`}>Nom</label><input className="champ" id={`n-${t.id}`} name="name" defaultValue={t.name} required /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
                      <div>
                        <label className="champ-label" htmlFor={`l-${t.id}`}>Chef d&apos;équipe</label>
                        <select className="champ" id={`l-${t.id}`} name="leader_id" defaultValue={t.leader_id ?? ""}><OptionsChefs /></select>
                      </div>
                      <div><label className="champ-label" htmlFor={`b-${t.id}`}>Bonus %</label><input className="champ" id={`b-${t.id}`} name="bonus_percent" type="number" min={0} max={100} defaultValue={t.bonus_percent} /></div>
                    </div>
                  </FormAction>
                  <div style={{ marginTop: 12 }}>
                    <BoutonAction action={supprimerEquipe.bind(null, t.id)} label="Supprimer l'équipe" confirmer={`Supprimer « ${t.name} » ? Ses membres resteront membres du club, sans équipe.`} />
                  </div>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </>
  );
}
