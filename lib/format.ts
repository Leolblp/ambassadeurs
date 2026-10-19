// Fonctions de mise en forme utilisables côté serveur et côté navigateur

export const numero = (n: number | null | undefined) => String(n ?? 0).padStart(3, "0");

export const pts = (n: number) => n.toLocaleString("fr-FR");

export function dateSoiree(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
}

export function dateCourte(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
}

export const PREUVE: Record<string, string> = {
  screenshot: "capture",
  photo: "photo",
  video: "vidéo",
  link: "lien",
  tickets: "billets avec ton code",
};

export const RAISON: Record<string, string> = {
  mission: "Mission validée",
  sale: "Billets vendus avec ton code",
  redemption: "Privilège débloqué",
  refund: "Billet remboursé",
  adjustment: "Ajustement de l'équipe",
};
