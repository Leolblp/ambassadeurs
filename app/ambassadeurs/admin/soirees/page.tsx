import { requireAdmin } from "@/lib/admin";
import { dateSoiree } from "@/lib/format";
import { creerSoiree, supprimerSoiree } from "../actions";
import { BoutonAction, FormAction } from "../ui";

export default async function Soirees() {
  const { supabase } = await requireAdmin();
  const { data: soirees } = await supabase.from("events").select("*").order("starts_at", { ascending: false }).limit(30);
  const maintenant = new Date();

  return (
    <>
      <header>
        <p className="label" style={{ margin: 0 }}>Soirées</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1 }}>Le calendrier du club</h1>
      </header>

      <section className="carte" style={{ padding: 20, maxWidth: 640 }}>
        <h2 className="label" style={{ margin: "0 0 14px" }}>Nouvelle soirée</h2>
        <FormAction action={creerSoiree} bouton="Ajouter la soirée">
          <div><label className="champ-label" htmlFor="name">Nom</label><input className="champ" id="name" name="name" required /></div>
          <div><label className="champ-label" htmlFor="starts_at">Date et heure (heure de Lyon)</label><input className="champ" id="starts_at" name="starts_at" type="datetime-local" required /></div>
          <div><label className="champ-label" htmlFor="ticket_url">Lien billetterie</label><input className="champ" id="ticket_url" name="ticket_url" type="url" placeholder="https://yurplan.com/…" /></div>
          <div><label className="champ-label" htmlFor="description">Description</label><textarea className="champ" id="description" name="description" rows={2} /></div>
        </FormAction>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(soirees ?? []).map((s) => {
          const passee = new Date(s.starts_at) < maintenant;
          return (
            <div key={s.id} className="carte" style={{ borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", opacity: passee ? 0.6 : 1 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: "var(--gris)", textTransform: "capitalize" }}>{dateSoiree(s.starts_at)}{passee ? " · passée" : ""}</div>
              </div>
              <BoutonAction action={supprimerSoiree.bind(null, s.id)} label="Supprimer" confirmer={`Supprimer « ${s.name} » ?`} />
            </div>
          );
        })}
      </section>
    </>
  );
}
