import "server-only";

export type Media = { id: string; nom: string; type: "image" | "video"; dossier: string };

const IMG = /\.(png|jpe?g|webp|gif|heic)$/i;
const VID = /\.(mp4|mov|m4v|webm)$/i;

/** Lit un dossier Drive public (vue intégrée de Google), sans clé d'API. */
async function lire(id: string) {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(id)}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) return [];
  const html = await r.text();
  const out: { id: string; nom: string; dossier: boolean }[] = [];
  const re = /<div class="flip-entry" id="entry-([\w-]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g;
  for (const m of html.matchAll(re)) {
    const nom = m[3].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    out.push({ id: m[1], nom, dossier: m[2].includes("/folders/") });
  }
  return out;
}

/** Tous les visuels et vidéos du dossier de la soirée, sous-dossiers compris (2 niveaux). Les dossiers et fichiers BDE et Billetterie sont exclus : ils ne sont pas pour les ambassadeurs. */
export async function kitDrive(dossierId: string): Promise<Media[]> {
  const res: Media[] = [];
  const parcourir = async (id: string, chemin: string, niveau: number) => {
    const items = await lire(id).catch(() => []);
    await Promise.all(items.map(async (it) => {
      if (it.dossier) {
        if (niveau < 2 && !/phrase|texte|source|psd|archive|bde|billetterie/i.test(it.nom)) await parcourir(it.id, chemin ? `${chemin} · ${it.nom}` : it.nom, niveau + 1);
      } else if ((IMG.test(it.nom) || VID.test(it.nom)) && !/\bbde\b/i.test(it.nom)) {
        res.push({ id: it.id, nom: it.nom, type: VID.test(it.nom) ? "video" : "image", dossier: chemin || "Visuels" });
      }
    }));
  };
  await parcourir(dossierId, "", 0);
  // stories d'abord, puis posts, puis vidéos ; ordre alphabétique ensuite
  const rang = (m: Media) => (/story/i.test(m.dossier) ? 0 : /post/i.test(m.dossier) ? 1 : m.type === "video" ? 2 : 3);
  return res.sort((a, b) => rang(a) - rang(b) || a.dossier.localeCompare(b.dossier) || a.nom.localeCompare(b.nom, "fr", { numeric: true })).slice(0, 60);
}
