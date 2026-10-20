// Modèles de missions prêts à publier depuis le back-office
// delai_h : échéance = début de la soirée + delai_h heures
export const MODELES_MISSIONS = [
  { title: "Partage le lien de la soirée en story", description: "Story avec le lien de billetterie de la prochaine soirée, visible par tous tes abonnés.", points: 150, proof_type: "screenshot", delai_h: 0 },
  { title: "Crée ta story avant la soirée", description: "Ta propre story pour annoncer que tu y seras : ton style, ta team, ton énergie. Identifie le compte de La Commerciale.", points: 150, proof_type: "screenshot", delai_h: 0 },
  { title: "Partage l'offre early ou la guestlist", description: "Relaie l'offre early bird ou l'ouverture de la guestlist pendant qu'elle est disponible.", points: 100, proof_type: "screenshot", delai_h: 0 },
  { title: "Invite 3 amis à découvrir le club", description: "Fais venir 3 personnes qui ne sont jamais venues : leurs billets doivent être pris avec ton code.", points: 300, proof_type: "tickets", delai_h: 0 },
  { title: "Ramène ta team pour une date spéciale", description: "Viens à 4 ou plus sur la date annoncée, billets pris avec ton code.", points: 300, proof_type: "tickets", delai_h: 0 },
  { title: "Poste une vidéo en story pendant la soirée", description: "Filme l'ambiance pendant la soirée et poste-la en story, en identifiant La Commerciale. Envoie la capture de ta story.", points: 200, proof_type: "screenshot", delai_h: 12 },
  { title: "Poste une photo de la soirée", description: "Dans les jours qui suivent la soirée, publie une photo de ta soirée en identifiant La Commerciale. Envoie la capture ou le lien.", points: 150, proof_type: "screenshot", delai_h: 72 },
] as const;
