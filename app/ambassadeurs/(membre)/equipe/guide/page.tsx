import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembre } from "@/lib/membre";
import { Encart, Etapes, Liste, P, Section, Sommaire, Tableau } from "../../../_components/Doc";

const SOMMAIRE = [
  { id: "role", titre: "Ton rôle" },
  { id: "recruter", titre: "Recruter ta team" },
  { id: "accepter", titre: "Accepter une demande" },
  { id: "preuves", titre: "Valider les preuves" },
  { id: "bonus", titre: "Ton bonus et le classement" },
  { id: "animer", titre: "Animer ta team" },
  { id: "regles", titre: "Les règles du jeu" },
];

export default async function GuideChef() {
  const { supabase, user } = await getMembre();
  const { data: team } = await supabase.from("teams").select("name, bonus_percent").eq("leader_id", user.id).maybeSingle();
  if (!team) redirect("/ambassadeurs");

  return (
    <div className="ecran" style={{ gap: 28, minHeight: "auto" }}>
      <header>
        <Link href="/ambassadeurs/equipe" style={{ fontSize: 13, color: "var(--gris)" }}>← Ma team</Link>
        <p className="label" style={{ margin: "16px 0 0" }}>Guide du chef d&apos;équipe</p>
        <h1 className="serif" style={{ margin: "6px 0 10px", fontSize: 40, lineHeight: 1 }}>Mener la team {team.name}</h1>
        <P>Tu as été choisi pour faire grandir une team au sein du XOXO Club. Voici comment t&apos;y prendre.</P>
      </header>

      <Sommaire items={SOMMAIRE} />

      <Section id="role" numero={1} titre="Ton rôle">
        <Liste items={[
          <><b>Recruter</b> des personnes qui font vraiment vivre les soirées.</>,
          <><b>Accepter</b> celles qui ont leur place dans le club.</>,
          <><b>Valider</b> les preuves de mission de ta team, rapidement.</>,
          <><b>Motiver</b> ta team pour qu&apos;elle monte au classement.</>,
        ]} />
        <Encart titre="Tu représentes le club" ton="astuce">Ta team porte l&apos;image de La Commerciale. Recrute peu, recrute bien.</Encart>
      </Section>

      <Section id="recruter" numero={2} titre="Recruter ta team">
        <Etapes items={[
          <>Dans <Link href="/ambassadeurs/equipe">Ma team</Link>, clique <b>Copier le lien</b> sous « Ton lien de recrutement ».</>,
          <>Envoie-le en message privé aux personnes que tu veux faire entrer. Évite de le poster publiquement.</>,
          <>Elles remplissent la demande d&apos;accès et voient « Recommandé par la team {team.name} ».</>,
          <>Leur demande arrive directement chez toi.</>,
        ]} />
      </Section>

      <Section id="accepter" numero={3} titre="Accepter une demande">
        <Etapes items={[
          <>Les demandes apparaissent en haut de <Link href="/ambassadeurs/equipe">Ma team</Link>.</>,
          <>Regarde l&apos;Instagram et la motivation.</>,
          <><b>Accepter</b> : la personne reçoit son invitation par email, avec son numéro et son code. Elle rejoint ta team automatiquement.</>,
          <><b>Refuser</b> : la demande est close.</>,
        ]} />
      </Section>

      <Section id="preuves" numero={4} titre="Valider les preuves">
        <P>Quand un membre de ta team envoie une preuve de mission, elle apparaît dans « Preuves à valider ».</P>
        <Etapes items={[
          <>Vérifie que la preuve correspond à la mission, qu&apos;elle est récente et visible publiquement.</>,
          <><b>Valider</b> : ses points sont crédités, et tu reçois ton bonus.</>,
          <><b>Refuser</b> : écris un motif clair. Il pourra renvoyer une preuve.</>,
        ]} />
        <Encart titre="Rapidité">Valide dans la journée. L&apos;équipe La Commerciale peut aussi valider à ta place si tu n&apos;es pas disponible.</Encart>
      </Section>

      <Section id="bonus" numero={5} titre="Ton bonus et le classement">
        <Tableau
          entetes={["Ce qui se passe", "Ce que tu gagnes"]}
          lignes={[
            ["Un membre de ta team valide une mission de 200 pts", `+${Math.floor(200 * team.bonus_percent / 100)} pts pour toi (${team.bonus_percent} %)`],
            ["Un membre de ta team vend des billets avec son code", `${team.bonus_percent} % de ses points de vente (bientôt)`],
            ["Tu fais toi-même une mission", "Ses points, comme tout membre"],
          ]}
        />
        <Liste items={[
          <>Ton bonus apparaît dans ton historique (« Bonus team {team.name} ») et s&apos;utilise comme tes autres points.</>,
          <>Le <b>classement des teams</b> additionne les points gagnés par tes membres dans le mois. Il repart à zéro chaque mois.</>,
          <>Les bonus ne comptent pas dans le classement individuel des membres.</>,
        ]} />
      </Section>

      <Section id="animer" numero={6} titre="Animer ta team">
        <Liste items={[
          <>Crée un groupe WhatsApp de ta team et relaie chaque nouvelle mission.</>,
          <>Félicite publiquement le meilleur de la semaine.</>,
          <>Relance gentiment ceux qui ont des missions « À faire ».</>,
          <>Le soir de la soirée, retrouve ta team sur place : c&apos;est là que le club prend vie.</>,
        ]} />
      </Section>

      <Section id="regles" numero={7} titre="Les règles du jeu">
        <Liste items={[
          <>Ne valide jamais une preuve douteuse, même pour un ami : l&apos;équipe peut retirer les points et le bonus.</>,
          <>Pas de spam, de faux comptes ou de faux engagements pour gonfler les chiffres.</>,
          <>Ne promets pas de privilèges qui n&apos;existent pas dans le club.</>,
          <>Une question ? Contacte l&apos;équipe La Commerciale.</>,
        ]} />
        <Encart titre="En cas d'abus" ton="attention">L&apos;équipe peut retirer des points, changer le chef d&apos;une team ou suspendre un membre.</Encart>
      </Section>
    </div>
  );
}
