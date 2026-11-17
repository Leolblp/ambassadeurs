/**
 * Paliers de la soirée : ce qu'un ambassadeur débloque selon ses billets vendus avec son code SUR UNE SOIRÉE.
 * Le compteur repart à zéro à chaque soirée. Rien n'est dépensé : tout se débloque en montant.
 */
export type Gain = { cle: string; titre: string; detail: string };

export const GRILLE: { ventes: string; titre: string; detail: string }[] = [
  { ventes: "2", titre: "Accès coupe-file", detail: "Tu passes devant la file." },
  { ventes: "3", titre: "Entrée gratuite", detail: "Ton entrée est offerte." },
  { ventes: "5", titre: "Bracelet VIP", detail: "Ton accès au carré VIP. Puis un bracelet de plus pour un pote toutes les 5 ventes." },
  { ventes: "7", titre: "1 conso offerte", detail: "Au bar, le soir même." },
  { ventes: "15", titre: "2 consos offertes", detail: "Puis une conso de plus toutes les 10 ventes." },
  { ventes: "40", titre: "Bouteille et carré VIP", detail: "Une bouteille à ta table, au carré VIP." },
  { ventes: "60", titre: "Ultra VIP", detail: "L'espace derrière le DJ. Puis un accès de plus toutes les 10 ventes." },
  { ventes: "100", titre: "2 bouteilles", detail: "Puis une bouteille de plus toutes les 50 ventes." },
];

const s = (n: number) => (n > 1 ? "s" : "");

/** Ce qui est débloqué pour un nombre de billets vendus sur la soirée. */
export function gains(v: number): Gain[] {
  const g: Gain[] = [];
  if (v >= 2) g.push({ cle: "coupe_file", titre: "Accès coupe-file", detail: "Tu passes devant la file." });
  if (v >= 3) g.push({ cle: "entree", titre: "Entrée gratuite", detail: "Ton entrée est offerte." });
  if (v >= 5) {
    const potes = Math.floor((v - 5) / 5);
    g.push({ cle: "vip", titre: `${1 + potes} bracelet${s(1 + potes)} VIP`, detail: potes ? `Le tien, et ${potes} pour tes potes.` : "Ton accès au carré VIP." });
  }
  const consos = v >= 15 ? 2 + Math.floor((v - 15) / 10) : v >= 7 ? 1 : 0;
  if (consos) g.push({ cle: "conso", titre: `${consos} conso${s(consos)} offerte${s(consos)}`, detail: "Au bar, le soir même." });
  const bouteilles = v >= 100 ? 2 + Math.floor((v - 100) / 50) : v >= 40 ? 1 : 0;
  if (bouteilles) g.push({ cle: "bouteille", titre: bouteilles > 1 ? `${bouteilles} bouteilles et carré VIP` : "Bouteille et carré VIP", detail: "À ta table, au carré VIP." });
  if (v >= 60) {
    const acces = 1 + Math.floor((v - 60) / 10);
    g.push({ cle: "ultra", titre: acces > 1 ? `${acces} accès Ultra VIP` : "Ultra VIP", detail: "L'espace derrière le DJ." });
  }
  return g;
}

const signature = (v: number) => gains(v).map((x) => x.titre).join("|");

/** Prochain palier : nombre de ventes à atteindre et ce qu'il apporte de nouveau. */
export function prochain(v: number): { seuil: number; reste: number; titre: string } {
  const avant = new Set(gains(v).map((x) => x.titre));
  for (let n = v + 1; n <= v + 50; n++) {
    if (signature(n) !== signature(v)) {
      const nouveau = gains(n).find((x) => !avant.has(x.titre));
      return { seuil: n, reste: n - v, titre: nouveau?.titre ?? "Nouveau palier" };
    }
  }
  return { seuil: v + 50, reste: 50, titre: "Nouveau palier" };
}

/** Palier précédent (pour la barre de progression). */
export function precedent(v: number): number {
  for (let n = v; n > 0; n--) if (signature(n) !== signature(n - 1)) return n;
  return 0;
}
