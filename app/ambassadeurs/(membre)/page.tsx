import Image from "next/image";
import Link from "next/link";
import { getMembre, numero, pts, dateSoiree, PREUVE } from "@/lib/membre";
import Copier from "../_components/Copier";

export default async function Accueil() {
  const { supabase, user, profil, solde } = await getMembre();

  const [classement, privileges, soiree, missions, preuves, reglages] = await Promise.all([
    supabase.rpc("leaderboard_month"),
    supabase.from("privileges").select("name, cost").eq("is_active", true).order("cost"),
    supabase.from("events").select("id, name, starts_at, ticket_url").gte("starts_at", new Date().toISOString()).order("starts_at").limit(1).maybeSingle(),
    supabase.from("missions").select("id, title, points, deadline, proof_type").eq("is_active", true).order("deadline", { ascending: true, nullsFirst: false }),
    supabase.from("proofs").select("mission_id, status").eq("member_id", user.id),
    supabase.from("app_settings").select("points_per_ticket").single(),
  ]);

  const lignes = (classement.data ?? []) as { member_id: string; rank: number }[];
  const moi = lignes.find((l) => l.member_id === user.id);
  const prochain = (privileges.data ?? []).find((p) => p.cost > solde);
  const progression = prochain ? Math.min(100, Math.round((solde / prochain.cost) * 100)) : 100;

  const faites = new Set((preuves.data ?? []).filter((p) => p.status !== "refused").map((p) => p.mission_id));
  const aFaire = (missions.data ?? []).filter((m) => !faites.has(m.id) && (!m.deadline || new Date(m.deadline) > new Date()));

  return (
    <div className="ecran" style={{ gap: 14, minHeight: "auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4 }}>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={64} height={38} priority />
        <Link href="/ambassadeurs/carte" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{profil.first_name ?? "Membre"}</div>
            <div className="label-gris" style={{ fontSize: 9 }}>Membre N° {numero(profil.member_number)}</div>
          </div>
          <span aria-hidden="true" className="display" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bord)", border: "1px solid var(--bord-rouge)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            {(profil.first_name?.[0] ?? "X") + (profil.last_name?.[0] ?? "")}
          </span>
        </Link>
      </header>

      <section className="carte" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="label-gris">Tes points</div>
            <div className="display" style={{ fontSize: 56, lineHeight: 1, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{pts(solde)}</div>
          </div>
          {moi && (
            <div style={{ textAlign: "right" }}>
              <div className="label-gris">Ce mois</div>
              <div className="display" style={{ fontSize: 28, lineHeight: 1, marginTop: 6, color: "var(--rouge)" }}>#{moi.rank}</div>
              <div style={{ fontSize: 11, color: "var(--gris)", marginTop: 2 }}>sur {lignes.length} membres</div>
            </div>
          )}
        </div>
        {prochain ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, marginBottom: 8 }}>
              <span>Prochain privilège : <b>{prochain.name}</b></span>
              <span style={{ color: "var(--gris)", whiteSpace: "nowrap" }}>{pts(prochain.cost - solde)} pts</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "var(--bord)", overflow: "hidden" }}>
              <div style={{ width: `${progression}%`, height: "100%", background: "var(--rouge)", borderRadius: 99 }} />
            </div>
          </div>
        ) : (
          <Link href="/ambassadeurs/privileges" style={{ fontSize: 13 }}>Tous les privilèges te sont ouverts →</Link>
        )}
      </section>

      {soiree.data && (
        <section style={{ borderRadius: 20, padding: "18px 20px", background: "var(--rouge)", color: "var(--fond)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase" }}>Prochaine soirée</div>
            <div className="display" style={{ fontSize: 26, lineHeight: 1.05, marginTop: 4, textTransform: "uppercase" }}>{soiree.data.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, textTransform: "capitalize" }}>{dateSoiree(soiree.data.starts_at)}</div>
          </div>
          <div style={{ textAlign: "center", flex: "none" }}>
            <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>{aFaire.length}</div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase" }}>missions</div>
          </div>
        </section>
      )}

      {profil.promo_code && (
        <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", border: "1px dashed var(--bord-rouge)", borderRadius: 16 }}>
          <div>
            <div className="label-gris">Ton code · {reglages.data?.points_per_ticket ?? 30} pts par billet</div>
            <div className="display" style={{ fontSize: 22, letterSpacing: ".08em", marginTop: 2 }}>{profil.promo_code}</div>
          </div>
          <Copier code={profil.promo_code} partage />
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="label" style={{ margin: 0, letterSpacing: ".22em" }}>Missions du moment</h2>
          <Link href="/ambassadeurs/missions" style={{ fontSize: 12, color: "var(--gris)" }}>Tout voir</Link>
        </div>
        {aFaire.length === 0 ? (
          <p className="carte" style={{ margin: 0, padding: 16, color: "var(--gris)", fontSize: 14 }}>Aucune mission en cours. Les prochaines arrivent bientôt.</p>
        ) : (
          aFaire.slice(0, 3).map((m) => (
            <Link key={m.id} href="/ambassadeurs/missions" className="carte" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, textDecoration: "none" }}>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: "var(--gris)", marginTop: 2 }}>Preuve : {PREUVE[m.proof_type] ?? "capture"}</div>
              </div>
              <span style={{ padding: "6px 10px", borderRadius: 99, background: "var(--bord)", fontSize: 12, fontWeight: 800 }}>+{m.points}</span>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
