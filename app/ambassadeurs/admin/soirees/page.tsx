import { requireAdmin } from "@/lib/admin";
import { dateSoiree } from "@/lib/format";
import { creerSoiree, modifierSoiree, supprimerSoiree } from "../actions";
import { BoutonAction, FormAction } from "../ui";

/** ISO -> "AAAA-MM-JJTHH:mm" à l'heure de Lyon, pour le champ datetime-local */
function saisieLyon(iso: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

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
            <details key={s.id} className="carte" style={{ borderRadius: 14, padding: "12px 16px", opacity: passee ? 0.6 : 1 }}>
              <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: "var(--gris)", textTransform: "capitalize" }}>{dateSoiree(s.starts_at)}{passee ? " · passée" : ""}</div>
                </div>
                <span style={{ fontSize: 12, color: "var(--gris)" }}>Modifier ▾</span>
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14, marginTop: 12, borderTop: "1px solid var(--bord)" }}>
                <FormAction action={modifierSoiree.bind(null, s.id)} bouton="Enregistrer">
                  <div><label className="champ-label" htmlFor={`n-${s.id}`}>Nom</label><input className="champ" id={`n-${s.id}`} name="name" required defaultValue={s.name} /></div>
                  <div><label className="champ-label" htmlFor={`d-${s.id}`}>Date et heure (heure de Lyon)</label><input className="champ" id={`d-${s.id}`} name="starts_at" type="datetime-local" required defaultValue={saisieLyon(s.starts_at)} /></div>
                  <div><label className="champ-label" htmlFor={`t-${s.id}`}>Lien billetterie</label><input className="champ" id={`t-${s.id}`} name="ticket_url" type="url" defaultValue={s.ticket_url ?? ""} placeholder="https://yurplan.com/…" /></div>
                  <div><label className="champ-label" htmlFor={`x-${s.id}`}>Description</label><textarea className="champ" id={`x-${s.id}`} name="description" rows={2} defaultValue={s.description ?? ""} /></div>
                </FormAction>
                <p style={{ margin: 0, fontSize: 12, color: "var(--gris)" }}>Si tu changes l&apos;heure, les échéances des missions liées sont décalées d&apos;autant et les cartes Wallet sont mises à jour.</p>
                <div><BoutonAction action={supprimerSoiree.bind(null, s.id)} label="Supprimer" confirmer={`Supprimer « ${s.name} » ?`} /></div>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}
