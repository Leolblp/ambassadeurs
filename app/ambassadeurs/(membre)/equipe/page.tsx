import { redirect } from "next/navigation";
import { getMembre, numero, pts, dateCourte } from "@/lib/membre";
import { accepterDemande, refuserDemande, validerPreuve, refuserPreuve } from "../../admin/actions";
import { BoutonAction, CopierTexte, RefusAvecMotif } from "../../admin/ui";

type Preuve = {
  id: string; member_id: string; file_path: string | null; link: string | null; created_at: string;
  missions: { title: string; points: number } | null;
};

export default async function MaTeam() {
  const { supabase, user } = await getMembre();
  const { data: team } = await supabase.from("teams").select("*").eq("leader_id", user.id).maybeSingle();
  if (!team) redirect("/ambassadeurs");

  const { data: membres } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, member_number, promo_code, status")
    .eq("team_id", team.id)
    .neq("id", user.id)
    .order("member_number");
  const ids = (membres ?? []).map((m) => m.id);

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const [journal, ventes, demandes, preuvesBrutes, classement, monBonus] = await Promise.all([
    ids.length ? supabase.from("points_ledger").select("member_id, delta, reason, created_at").in("member_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("sales").select("member_id, ticket_count, status").in("member_id", ids) : Promise.resolve({ data: [] }),
    supabase.from("access_requests").select("*").eq("team_id", team.id).eq("status", "pending").order("created_at"),
    ids.length ? supabase.from("proofs").select("id, member_id, file_path, link, created_at, missions(title, points)").in("member_id", ids).eq("status", "pending").order("created_at") : Promise.resolve({ data: [] }),
    supabase.rpc("leaderboard_teams_month"),
    supabase.from("points_ledger").select("delta").eq("member_id", user.id).eq("reason", "team_bonus"),
  ]);

  const total = new Map<string, number>();
  const mois = new Map<string, number>();
  for (const l of (journal.data ?? []) as { member_id: string; delta: number; reason: string; created_at: string }[]) {
    total.set(l.member_id, (total.get(l.member_id) ?? 0) + l.delta);
    if (l.delta > 0 && l.reason !== "team_bonus" && new Date(l.created_at) >= debutMois) mois.set(l.member_id, (mois.get(l.member_id) ?? 0) + l.delta);
  }
  const billets = new Map<string, number>();
  for (const v of (ventes.data ?? []) as { member_id: string; ticket_count: number; status: string }[]) {
    if (v.status === "valid") billets.set(v.member_id, (billets.get(v.member_id) ?? 0) + v.ticket_count);
  }
  const tri = [...(membres ?? [])].sort((a, b) => (mois.get(b.id) ?? 0) - (mois.get(a.id) ?? 0));

  const lignes = (classement.data ?? []) as { team_id: string; name: string; points: number; rank: number }[];
  const nous = lignes.find((l) => l.team_id === team.id);
  const bonusTotal = ((monBonus.data ?? []) as { delta: number }[]).reduce((s, b) => s + b.delta, 0);

  const preuves = (preuvesBrutes.data ?? []) as unknown as Preuve[];
  const chemins = preuves.map((p) => p.file_path).filter(Boolean) as string[];
  const urls = new Map<string, string>();
  if (chemins.length) {
    const { data: signees } = await supabase.storage.from("proofs").createSignedUrls(chemins, 3600);
    for (const s of signees ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  const nomDe = new Map((membres ?? []).map((m) => [m.id, `${m.first_name ?? ""} ${m.last_name?.[0] ? m.last_name[0] + "." : ""}`.trim()]));

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://lacom.club";
  const lien = `${site}/ambassadeurs/rejoindre?team=${team.invite_code}`;

  return (
    <div className="ecran" style={{ gap: 16, minHeight: "auto" }}>
      <div>
        <p className="label" style={{ margin: 0 }}>Chef d&apos;équipe</p>
        <h1 className="display" style={{ margin: "6px 0 0", fontSize: 38, lineHeight: 1, textTransform: "uppercase", fontWeight: 400 }}>{team.name}</h1>
        <a href="/ambassadeurs/equipe/guide" style={{ display: "inline-block", marginTop: 10, fontSize: 13 }}>Lire le guide du chef d&apos;équipe →</a>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {[
          { l: "Membres", v: String(ids.length) },
          { l: "Rang du mois", v: nous ? `#${nous.rank}` : "–" },
          { l: `Ton bonus ${team.bonus_percent} %`, v: pts(bonusTotal) },
        ].map((k) => (
          <div key={k.l} className="carte" style={{ borderRadius: 14, padding: 12 }}>
            <div className="label-gris" style={{ fontSize: 9 }}>{k.l}</div>
            <div className="display" style={{ fontSize: 26, marginTop: 4 }}>{k.v}</div>
          </div>
        ))}
      </section>

      <section style={{ padding: "14px 16px", border: "1px dashed var(--bord-rouge)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="label-gris">Ton lien de recrutement</div>
        <div style={{ fontSize: 13, wordBreak: "break-all" }}>{lien}</div>
        <div><CopierTexte texte={lien} label="Copier le lien" /></div>
        <div style={{ fontSize: 12, color: "var(--gris)" }}>Les demandes envoyées avec ce lien arrivent directement ici.</div>
      </section>

      {(demandes.data ?? []).length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 className="label" style={{ margin: 0 }}>Demandes pour ta team</h2>
          {(demandes.data ?? []).map((d) => {
            const insta = d.instagram?.replace(/^@/, "");
            return (
              <article key={d.id} className="carte" style={{ borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{d.first_name} {d.last_name}</div>
                  <div style={{ fontSize: 12, color: "var(--gris)" }}>
                    {insta ? <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer">@{insta}</a> : "Pas d'Instagram"} · {dateCourte(d.created_at)}
                  </div>
                </div>
                {d.motivation && <p style={{ margin: 0, fontSize: 13, color: "var(--gris)" }}>« {d.motivation} »</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <BoutonAction action={accepterDemande.bind(null, d.id)} label="Accepter" variante="vert" />
                  <BoutonAction action={refuserDemande.bind(null, d.id)} label="Refuser" confirmer={`Refuser ${d.first_name} ?`} />
                </div>
              </article>
            );
          })}
        </section>
      )}

      {preuves.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 className="label" style={{ margin: 0 }}>Preuves à valider</h2>
          {preuves.map((p) => {
            const url = p.file_path ? urls.get(p.file_path) : null;
            const video = p.file_path && /\.(mp4|mov)$/i.test(p.file_path);
            return (
              <article key={p.id} className="carte" style={{ borderRadius: 16, overflow: "hidden" }}>
                {url && (
                  <div style={{ background: "#1c1010", maxHeight: 320, display: "flex", justifyContent: "center" }}>
                    {video
                      ? <video src={url} controls style={{ maxWidth: "100%", maxHeight: 320 }} />
                      : /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={url} alt="Preuve" style={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain" }} />}
                  </div>
                )}
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ display: "block", padding: "14px 14px 0", fontSize: 13, wordBreak: "break-all" }}>{url ? "Voir la vidéo ↗" : p.link}</a>}
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{nomDe.get(p.member_id)}</div>
                      <div style={{ fontSize: 12, color: "var(--gris)" }}>{p.missions?.title}</div>
                    </div>
                    <span style={{ alignSelf: "flex-start", padding: "5px 9px", borderRadius: 99, background: "var(--bord)", fontSize: 12, fontWeight: 800 }}>+{p.missions?.points}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <BoutonAction action={validerPreuve.bind(null, p.id)} label="Valider" variante="vert" />
                    <RefusAvecMotif action={refuserPreuve.bind(null, p.id)} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 className="label" style={{ margin: 0 }}>Ta team ce mois-ci</h2>
        {tri.length === 0 ? (
          <p className="carte" style={{ margin: 0, padding: 16, color: "var(--gris)", fontSize: 14 }}>Ta team est vide. Partage ton lien de recrutement.</p>
        ) : (
          tri.map((m, i) => (
            <div key={m.id} className="carte" style={{ borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, opacity: m.status === "suspended" ? 0.5 : 1 }}>
              <span className="display" style={{ width: 28, fontSize: 18, color: i < 3 ? "var(--rouge)" : "var(--gris)" }}>{i + 1}</span>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.first_name} {m.last_name}</div>
                <div style={{ fontSize: 11, color: "var(--gris)" }}>N° {numero(m.member_number)} · {billets.get(m.id) ?? 0} billets · {pts(total.get(m.id) ?? 0)} pts au total</div>
              </div>
              <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>+{pts(mois.get(m.id) ?? 0)}</span>
            </div>
          ))
        )}
      </section>

      {lignes.length > 1 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className="label" style={{ margin: 0 }}>Classement des teams</h2>
          {lignes.map((l) => (
            <div key={l.team_id} className="carte" style={{ borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", borderColor: l.team_id === team.id ? "var(--bord-rouge)" : "var(--bord)" }}>
              <span><b style={{ color: "var(--rouge)" }}>#{l.rank}</b> {l.name}</span>
              <span style={{ fontWeight: 700 }}>{pts(l.points)} pts</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
