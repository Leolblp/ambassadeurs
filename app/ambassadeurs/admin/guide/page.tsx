import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { Encart, Etapes, Liste, P, Section, Sommaire, Tableau } from "../../_components/Doc";

const SOMMAIRE = [
  { id: "principe", titre: "Le principe du club" },
  { id: "semaine", titre: "Ta routine de la semaine" },
  { id: "demandes", titre: "Accepter un nouveau membre" },
  { id: "soirees", titre: "Créer une soirée" },
  { id: "missions", titre: "Publier une mission" },
  { id: "preuves", titre: "Valider les preuves" },
  { id: "points", titre: "Points et barème" },
  { id: "privileges", titre: "Remettre un privilège" },
  { id: "equipes", titre: "Équipes et chefs d'équipe" },
  { id: "membres", titre: "Gérer les membres et les admins" },
  { id: "emails", titre: "Emails et connexion" },
  { id: "depannage", titre: "En cas de problème" },
];

export default async function GuideAdmin() {
  await requireAdmin();

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 28 }}>
      <header>
        <p className="label" style={{ margin: 0 }}>Guide de l&apos;équipe</p>
        <h1 className="serif" style={{ margin: "6px 0 10px", fontSize: 44, lineHeight: 1 }}>Faire vivre le club</h1>
        <P>Tout ce qu&apos;il faut savoir pour gérer le XOXO Club au quotidien. Lis-le une fois en entier, puis reviens-y quand tu as un doute.</P>
      </header>

      <Sommaire items={SOMMAIRE} />

      <Section id="principe" numero={1} titre="Le principe du club">
        <P>Le XOXO Club est le cercle privé de La Commerciale. On y entre <b>sur sélection</b>. Les membres font rayonner les soirées : stories, line-up relayé, affichage, et surtout <b>des billets vendus avec leur code</b>.</P>
        <Liste items={[
          <>Chaque action validée rapporte des <b>points</b>.</>,
          <>Les points s&apos;échangent contre des <b>privilèges</b> (coupe-file, entrée offerte, backstage, bouteille…).</>,
          <>Les membres peuvent appartenir à une <b>team</b> menée par un chef d&apos;équipe.</>,
          <>Un <b>classement du mois</b> entretient l&apos;émulation entre membres et entre teams.</>,
        ]} />
        <Encart titre="Le ton" ton="astuce">On parle de <b>membres</b>, d&apos;<b>accès</b> et de <b>privilèges</b>, jamais d&apos;« ambassadeurs » ou de « récompenses ». Les membres doivent se sentir chanceux d&apos;en faire partie.</Encart>
      </Section>

      <Section id="semaine" numero={2} titre="Ta routine de la semaine">
        <Tableau
          entetes={["Quand", "Quoi", "Où"]}
          lignes={[
            ["Dimanche", "Lancement de la semaine : créer la soirée et 3 ou 4 missions", <Link key="m" href="/ambassadeurs/admin/missions">Missions</Link>],
            ["Dimanche", "Annoncer les missions sur WhatsApp (bouton « Message WhatsApp »)", <Link key="m2" href="/ambassadeurs/admin/missions">Missions</Link>],
            ["Chaque jour", "Valider les preuves en attente (le chiffre rouge dans le menu)", <Link key="p" href="/ambassadeurs/admin">Preuves</Link>],
            ["Chaque jour", "Traiter les demandes d'accès", <Link key="d" href="/ambassadeurs/admin/demandes">Demandes</Link>],
            ["Le soir de la soirée", "Remettre les privilèges débloqués", <Link key="r" href="/ambassadeurs/admin/privileges">Privilèges</Link>],
            ["Après la soirée", "Archiver les missions terminées", <Link key="a" href="/ambassadeurs/admin/missions">Missions</Link>],
          ]}
        />
        <Encart titre="La semaine du club">La semaine de communication commence le <b>dimanche</b> : les missions de la semaine doivent être en ligne et annoncées avant dimanche soir.</Encart>
        <Encart titre="Règle d'or">Une preuve doit être validée <b>sous 48 h</b>. Un membre qui attend ses points se démotive.</Encart>
      </Section>

      <Section id="demandes" numero={3} titre="Accepter un nouveau membre">
        <P>Les candidatures arrivent depuis <b>lacom.club/ambassadeurs/rejoindre</b> (lien en bio Instagram) ou depuis le lien de recrutement d&apos;un chef d&apos;équipe.</P>
        <Etapes items={[
          <>Ouvre <Link href="/ambassadeurs/admin/demandes">Demandes d&apos;accès</Link>.</>,
          <>Regarde le profil Instagram (cliquable) et la motivation. Si la demande vient d&apos;une team, c&apos;est indiqué sous le nom.</>,
          <>Clique <b>Accepter</b> : le compte est créé, un numéro de membre et un code personnel (ex. <code>LEA-XOXO</code>) sont attribués, et l&apos;email « Bienvenue dans le XOXO Club » part automatiquement.</>,
          <>Ou clique <b>Refuser</b> : la personne n&apos;est pas prévenue, la demande passe dans « Dernières décisions ».</>,
        ]} />
        <Encart titre="Sélection" ton="astuce">Garde le club rare. Mieux vaut 30 membres actifs que 200 inactifs. Les demandes venant d&apos;un chef d&apos;équipe peuvent aussi être acceptées par ce chef.</Encart>
      </Section>

      <Section id="soirees" numero={4} titre="Créer une soirée">
        <Etapes items={[
          <>Ouvre <Link href="/ambassadeurs/admin/soirees">Soirées</Link>.</>,
          <>Renseigne le nom, la date et l&apos;heure (<b>heure de Lyon</b>) et le lien de billetterie.</>,
          <>Clique <b>Ajouter la soirée</b>. Elle apparaît sur l&apos;accueil de tous les membres comme « Prochaine soirée ».</>,
        ]} />
      </Section>

      <Section id="missions" numero={5} titre="Publier une mission">
        <Etapes items={[
          <>Ouvre <Link href="/ambassadeurs/admin/missions">Missions</Link>.</>,
          <>Donne un titre court à l&apos;impératif (« Partage l&apos;affiche en story ») et une consigne précise.</>,
          <>Choisis les points, le type de preuve, une échéance et la soirée liée.</>,
          <>Clique <b>Publier la mission</b>, puis <b>Message WhatsApp</b> pour copier l&apos;annonce et la coller dans la communauté.</>,
        ]} />
        <Tableau
          entetes={["Type de preuve", "Ce que le membre envoie"]}
          lignes={[
            ["Capture", "Une capture d'écran (story, publication)"],
            ["Capture + lien", "Pour toute vidéo (story, TikTok, réel) : la capture et le lien de la vidéo. Aucun fichier vidéo n'est envoyé."],
            ["Lien", "L'adresse d'une publication"],
            ["Billets avec ton code", "Rien : les points viennent des ventes faites avec son code"],
          ]}
        />
        <Encart titre="Archiver">Une mission terminée se <b>archive</b> (elle disparaît chez les membres) au lieu d&apos;être supprimée : l&apos;historique des points reste intact.</Encart>
      </Section>

      <Section id="preuves" numero={6} titre="Valider les preuves">
        <Etapes items={[
          <>Ouvre <Link href="/ambassadeurs/admin">Preuves</Link>. Le chiffre rouge dans le menu indique combien attendent.</>,
          <>Regarde la capture, la photo ou la vidéo (clic sur l&apos;image pour l&apos;agrandir).</>,
          <><b>Valider</b> : les points sont crédités immédiatement. Si le membre a une team, son chef reçoit aussi son bonus.</>,
          <><b>Refuser</b> : écris un motif clair (« la story doit montrer l&apos;affiche en entier »). Le membre le voit et peut renvoyer une preuve.</>,
        ]} />
        <Encart titre="Suppression automatique" ton="astuce">Les fichiers de preuve (captures, photos, vidéos) sont supprimés automatiquement <b>5 jours après la soirée</b> liée à la mission (ou 5 jours après la validation s&apos;il n&apos;y a pas de soirée). Les preuves en attente ne sont jamais supprimées. Les points et l&apos;historique restent.</Encart>
        <Encart titre="Ce qu'on vérifie" ton="attention">La preuve correspond bien à la mission, elle est récente, elle vient du compte du membre, et la publication est visible (pas en « amis proches »).</Encart>
      </Section>

      <Section id="points" numero={7} titre="Points et barème">
        <P>Le solde d&apos;un membre est la somme de son historique : rien n&apos;est modifiable à la main sans laisser de trace.</P>
        <Tableau
          entetes={["Source", "Points", "Détail"]}
          lignes={[
            ["Mission validée", "Fixés par mission", "Repère : 100 à 300 selon l'effort"],
            ["Billet vendu avec son code", "30 par billet", "Import Yurplan (bientôt)"],
            ["Bonus chef d'équipe", "% des points de sa team", "10 % par défaut, réglable par équipe"],
            ["Ajustement", "Libre (+ ou -)", "Depuis la fiche du membre, avec une raison visible"],
            ["Privilège débloqué", "Coût du privilège (-)", "Rendus si tu annules"],
          ]}
        />
        <Encart titre="Classement" ton="astuce">Le classement repart à zéro <b>chaque mois</b>. Les bonus de chef ne comptent pas dans le classement des membres. Le solde, lui, ne se remet jamais à zéro.</Encart>
      </Section>

      <Section id="privileges" numero={8} titre="Remettre un privilège">
        <Etapes items={[
          <>Quand un membre débloque un privilège, ses points sont retirés et le privilège apparaît dans <Link href="/ambassadeurs/admin/privileges">Privilèges à remettre</Link>.</>,
          <>Le soir venu, le membre se présente : remets-lui son privilège et clique <b>Remis</b>.</>,
          <>Impossible de l&apos;honorer ? Clique <b>Annuler</b> : les points lui sont rendus automatiquement.</>,
        ]} />
      </Section>

      <Section id="equipes" numero={9} titre="Équipes et chefs d'équipe">
        <P>Une team est un petit groupe de membres mené par un chef d&apos;équipe, qui recrute, anime et valide pour sa team.</P>
        <Etapes items={[
          <>Ouvre <Link href="/ambassadeurs/admin/equipes">Équipes</Link>, donne un nom, choisis le chef parmi les membres et son bonus (10 % par défaut).</>,
          <>Un lien de recrutement unique est créé. Copie-le et envoie-le au chef.</>,
          <>Pour déplacer un membre d&apos;une team à une autre, va dans <Link href="/ambassadeurs/admin/membres">Membres</Link>, ouvre sa fiche, choisis l&apos;équipe et clique <b>Affecter</b>.</>,
        ]} />
        <Tableau
          entetes={["Le chef d'équipe peut", "Il ne peut pas"]}
          lignes={[
            ["Voir les points et billets de sa team", "Voir les autres teams en détail"],
            ["Accepter les demandes arrivées par son lien", "Accepter les autres demandes"],
            ["Valider les preuves de sa team", "Ajuster des points ou remettre des privilèges"],
            ["Partager son lien de recrutement", "Créer des missions ou des soirées"],
          ]}
        />
      </Section>

      <Section id="membres" numero={10} titre="Gérer les membres et les admins">
        <P>Dans <Link href="/ambassadeurs/admin/membres">Membres</Link>, clique sur un membre pour ouvrir sa fiche :</P>
        <Liste items={[
          <><b>Affecter</b> à une équipe.</>,
          <><b>Ajuster les points</b> (+50, -50…) avec une raison que le membre verra dans son historique.</>,
          <><b>Passer admin</b> : donne accès à tout le back-office. Réservé à l&apos;équipe La Commerciale.</>,
          <><b>Suspendre</b> : le membre disparaît du classement. Utile en cas d&apos;abus.</>,
        ]} />
        <Encart titre="Attention" ton="attention">Un admin peut accepter des membres et modifier des points. Ne donne cet accès qu&apos;à des personnes de confiance.</Encart>
      </Section>

      <Section id="emails" numero={11} titre="Emails et connexion">
        <Liste items={[
          <>Il n&apos;y a <b>pas de mot de passe</b> : on se connecte avec un lien reçu par email, valable une heure.</>,
          <>Les emails partent de <b>XOXO Club &lt;xoxo@lacom.club&gt;</b>. Personne ne lit cette adresse : les membres doivent te contacter sur WhatsApp ou Instagram.</>,
          <>Si un membre ne reçoit rien : vérifier ses spams, puis l&apos;orthographe de son email dans sa fiche.</>,
        ]} />
      </Section>

      <Section id="depannage" numero={12} titre="En cas de problème">
        <Tableau
          entetes={["Situation", "Que faire"]}
          lignes={[
            ["« Cet email a déjà un compte »", "La personne est déjà membre : elle peut se connecter directement sur lacom.club/ambassadeurs/connexion."],
            ["Points crédités par erreur", "Fiche du membre > ajustement négatif avec la raison."],
            ["Privilège débloqué par erreur", "Privilèges à remettre > Annuler (points rendus)."],
            ["Un membre triche", "Refuser ses preuves, ajuster ses points, puis Suspendre si besoin."],
            ["Lien de connexion expiré", "Le membre redemande un lien depuis la page de connexion."],
          ]}
        />
      </Section>
    </div>
  );
}
