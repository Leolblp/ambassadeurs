import { requireAdmin } from "@/lib/admin";
import { numero, dateCourte } from "@/lib/format";
import { validerPreuve, refuserPreuve } from "./actions";
import { BoutonAction, RefusAvecMotif } from "./ui";

type Ligne = {
  id: string; file_path: string | null; link: string | null; created_at: string;
  missions: { title: string; points: number } | null;
  profiles: { first_name: string | null; last_name: string | null; member_number: number | null } | null;
};

export default async function Preuves() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("proofs")
    .select("id, file_path, link, created_at, missions(title, points), profiles!proofs_member_id_fkey(first_name, last_name, member_number)")
    .eq("status", "pending")
    .order("created_at");
  const preuves = (data ?? []) as unknown as Ligne[];

  const chemins = preuves.map((p) => p.file_path).filter(Boolean) as string[];
  const urls = new Map<string, string>();
  if (chemins.length) {
    const { data: signees } = await supabase.storage.from("proofs").createSignedUrls(chemins, 3600);
    for (const s of signees ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>File des preuves</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>À valider</h1>
      </header>

      {preuves.length === 0 ? (
        <p className="carte" style={{ padding: 32, textAlign: "center", color: "var(--gris)" }}>Tout est validé. Rien en attente.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {preuves.map((p) => {
            const url = p.file_path ? urls.get(p.file_path) : null;
            const video = p.file_path && /\.(mp4|mov)$/i.test(p.file_path);
            const nom = [p.profiles?.first_name, p.profiles?.last_name?.[0] && p.profiles.last_name[0] + "."].filter(Boolean).join(" ");
            return (
              <article key={p.id} className="carte" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ aspectRatio: "4 / 5", maxHeight: 360, background: "#1c1010", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {url && video && <video src={url} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                  {url && !video && (
                    <a href={url} target="_blank" rel="noreferrer" style={{ width: "100%", height: "100%" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Preuve de ${nom}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </a>
                  )}
                  {!url && p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ padding: 16, wordBreak: "break-all" }}>{p.link}</a>}
                  {!url && !p.link && <span className="label-gris">Aucun fichier</span>}
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{nom || "Membre"} · N° {numero(p.profiles?.member_number)}</div>
                      <div style={{ fontSize: 13, color: "var(--gris)", marginTop: 2 }}>{p.missions?.title}</div>
                    </div>
                    <span style={{ flex: "none", alignSelf: "flex-start", padding: "5px 9px", borderRadius: 99, background: "var(--bord)", fontSize: 12, fontWeight: 800 }}>+{p.missions?.points}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gris)" }}>Envoyée {dateCourte(p.created_at)}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <BoutonAction action={validerPreuve.bind(null, p.id)} label="Valider" variante="vert" />
                    <RefusAvecMotif action={refuserPreuve.bind(null, p.id)} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
