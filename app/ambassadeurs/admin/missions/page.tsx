import { requireAdmin } from "@/lib/admin";
import { dateCourte, PREUVE } from "@/lib/format";
import { basculerMission, creerMission, publierModele } from "../actions";
import { MODELES_MISSIONS } from "@/lib/modeles";
import { BoutonAction, CopierTexte, FormAction } from "../ui";

export default async function Missions() {
  const { supabase } = await requireAdmin();
  const [{ data: missions }, { data: soirees }, { data: preuves }] = await Promise.all([
    supabase.from("missions").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("id, name, starts_at").gte("starts_at", new Date().toISOString()).order("starts_at"),
    supabase.from("proofs").select("mission_id, status"),
  ]);

  const stats = new Map<string, { attente: number; validees: number }>();
  for (const p of preuves ?? []) {
    const s = stats.get(p.mission_id) ?? { attente: 0, validees: 0 };
    if (p.status === "pending") s.attente++;
    if (p.status === "approved") s.validees++;
    stats.set(p.mission_id, s);
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://lacom.club";

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Missions</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Donner le tempo</h1>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <h2 className="label" style={{ margin: 0 }}>Modèles prêts à publier</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--gris)" }}>Un clic publie la mission, liée automatiquement à la prochaine soirée (échéance = début de la soirée).</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {MODELES_MISSIONS.map((m, i) => (
            <div key={m.title} className="carte" style={{ borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <b style={{ fontSize: 14 }}>{m.title}</b>
                <span style={{ flex: "none", fontSize: 12, fontWeight: 800 }}>+{m.points}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--gris)" }}>Preuve : {PREUVE[m.proof_type]}</div>
              <div><BoutonAction action={publierModele.bind(null, i)} label="Publier" variante="plein" /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="carte" style={{ padding: 20, maxWidth: 640 }}>
        <h2 className="label" style={{ margin: "0 0 14px" }}>Mission sur mesure</h2>
        <FormAction action={creerMission} bouton="Publier la mission">
          <div><label className="champ-label" htmlFor="title">Titre</label><input className="champ" id="title" name="title" required placeholder="Partage l'affiche en story" /></div>
          <div><label className="champ-label" htmlFor="description">Consigne</label><textarea className="champ" id="description" name="description" rows={2} placeholder="Ce qu'il faut faire précisément" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <div><label className="champ-label" htmlFor="points">Points</label><input className="champ" id="points" name="points" type="number" min={0} step={10} required defaultValue={150} /></div>
            <div>
              <label className="champ-label" htmlFor="proof_type">Preuve attendue</label>
              <select className="champ" id="proof_type" name="proof_type" defaultValue="screenshot">
                {Object.entries(PREUVE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <div><label className="champ-label" htmlFor="deadline">Échéance</label><input className="champ" id="deadline" name="deadline" type="datetime-local" /></div>
            <div>
              <label className="champ-label" htmlFor="event_id">Soirée liée</label>
              <select className="champ" id="event_id" name="event_id" defaultValue="">
                <option value="">Aucune</option>
                {(soirees ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </FormAction>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(missions ?? []).map((m) => {
          const s = stats.get(m.id) ?? { attente: 0, validees: 0 };
          const annonce = `Nouvelle mission XOXO : ${m.title} (+${m.points} pts)${m.deadline ? `, avant ${dateCourte(m.deadline)}` : ""}.\nÀ retrouver dans ton espace : ${site}/ambassadeurs/missions`;
          return (
            <article key={m.id} className="carte" style={{ borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", opacity: m.is_active ? 1 : 0.55 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{m.title} <span style={{ color: "var(--gris)", fontWeight: 500 }}>· +{m.points}</span></div>
                <div style={{ fontSize: 13, color: "var(--gris)", marginTop: 2 }}>
                  Preuve : {PREUVE[m.proof_type]}{m.deadline ? ` · avant ${dateCourte(m.deadline)}` : ""} · {s.validees} validée{s.validees > 1 ? "s" : ""}, {s.attente} en attente
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                {m.is_active && <CopierTexte texte={annonce} label="Message WhatsApp" />}
                <BoutonAction action={basculerMission.bind(null, m.id, !m.is_active)} label={m.is_active ? "Archiver" : "Réactiver"} />
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
