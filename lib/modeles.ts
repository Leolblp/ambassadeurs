// Modèles de missions prêts à publier depuis le back-office
export const MODELES_MISSIONS = [
  { title: "Partage le lien de la soirée en story", description: "Story avec le lien de billetterie de la prochaine soirée, visible par tous tes abonnés.", points: 150, proof_type: "screenshot" },
  { title: "Crée ta story avant la soirée", description: "Ta propre story pour annoncer que tu y seras : ton style, ta team, ton énergie. Identifie le compte de La Commerciale.", points: 150, proof_type: "screenshot" },
  { title: "Relaie le line-up", description: "Reposte l'annonce du line-up en story, en identifiant La Commerciale.", points: 100, proof_type: "screenshot" },
  { title: "Partage l'offre early ou la guestlist", description: "Relaie l'offre early bird ou l'ouverture de la guestlist pendant qu'elle est disponible.", points: 100, proof_type: "screenshot" },
  { title: "Invite 3 amis à découvrir le club", description: "Fais venir 3 personnes qui ne sont jamais venues : leurs billets doivent être pris avec ton code.", points: 300, proof_type: "tickets" },
  { title: "Ramène ta team pour une date spéciale", description: "Viens à 4 ou plus sur la date annoncée, billets pris avec ton code.", points: 300, proof_type: "tickets" },
  { title: "Poste une vidéo souvenir de la dernière soirée", description: "Une vidéo de la dernière soirée en story ou en réel, en identifiant La Commerciale.", points: 200, proof_type: "video" },
  { title: "Partage ton retour d'expérience après la soirée", description: "Story ou publication sur ta soirée : ce que tu as aimé, le moment fort. Envoie la capture ou le lien.", points: 150, proof_type: "screenshot" },
] as const;
