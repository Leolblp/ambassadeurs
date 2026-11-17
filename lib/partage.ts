/** Dossier Drive des visuels : première adresse de dossier trouvée dans la description de la soirée. */
export function dossierDrive(description: string | null | undefined) {
  const url = /https?:\/\/drive\.google\.com\/[^\s)]+/.exec(description ?? "")?.[0] ?? null;
  const id = url?.match(/folders\/([\w-]+)/)?.[1] ?? null;
  return url && id ? { url, id } : null;
}

/** Lien de billetterie perso : sur Yurplan, le code de l'ambassadeur est appliqué tout seul à l'ouverture. */
export function lienPerso(url: string | null | undefined, code: string | null | undefined) {
  if (!url) return null;
  if (!code) return url;
  try {
    const u = new URL(url);
    if (/(^|\.)(yp\.events|yurplan\.com)$/i.test(u.hostname)) u.searchParams.set("code", code);
    return u.toString();
  } catch {
    return url;
  }
}

/** « Thursday 19.11 » : la communication de La Commerciale est en anglais. */
export function jourAnglais(iso: string) {
  const d = new Date(new Date(iso).getTime() - 8 * 3600e3); // une soirée qui commence après minuit reste sur la veille
  const j = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "long" }).format(d);
  const n = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit" }).format(d).replace("/", ".");
  return `${j} ${n}`;
}

/** Texte prêt à coller en story ou en message. */
export function texteStory(soiree: { starts_at: string }, code: string | null, lien: string | null) {
  return `La Commerciale · ${jourAnglais(soiree.starts_at)} AU AZAR CLUB${code ? `\nGet your ticket with my code ${code}` : ""}${lien ? `\n${lien}` : ""}`;
}
