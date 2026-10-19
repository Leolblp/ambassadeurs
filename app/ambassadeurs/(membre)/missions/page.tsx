import { getMembre } from "@/lib/membre";
import ListeMissions, { type Mission } from "./ListeMissions";

export default async function Missions() {
  const { supabase, user } = await getMembre();

  const [{ data: missions }, { data: preuves }] = await Promise.all([
    supabase.from("missions").select("id, title, description, points, deadline, proof_type").eq("is_active", true).order("deadline", { ascending: true, nullsFirst: false }),
    supabase.from("proofs").select("mission_id, status, review_message, created_at").eq("member_id", user.id).order("created_at", { ascending: false }),
  ]);

  // Dernière preuve envoyée pour chaque mission
  const derniere = new Map<string, { status: string; review_message: string | null }>();
  for (const p of preuves ?? []) if (!derniere.has(p.mission_id)) derniere.set(p.mission_id, p);

  const liste: Mission[] = (missions ?? []).map((m) => {
    const p = derniere.get(m.id);
    const expiree = !!m.deadline && new Date(m.deadline) < new Date();
    return {
      ...m,
      etat: p?.status === "approved" ? "validee" : p?.status === "pending" ? "attente" : expiree ? "expiree" : "afaire",
      refus: p?.status === "refused" ? p.review_message ?? "Preuve refusée, tu peux en renvoyer une." : null,
    };
  });

  return (
    <div className="ecran" style={{ gap: 6, minHeight: "auto" }}>
      <p className="label" style={{ margin: 0 }}>Missions</p>
      <h1 className="serif" style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>Fais rayonner la prochaine soirée.</h1>
      <ListeMissions missions={liste} uid={user.id} />
    </div>
  );
}
