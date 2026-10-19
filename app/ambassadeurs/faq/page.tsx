import Image from "next/image";
import Link from "next/link";
import { Question } from "../_components/Doc";

export const metadata = { title: "Questions fréquentes · XOXO Club" };

const BLOCS: { titre: string; questions: { q: string; r: React.ReactNode }[] }[] = [
  {
    titre: "Le club",
    questions: [
      { q: "C'est quoi, le XOXO Club ?", r: <p style={{ margin: 0 }}>Le cercle privé de La Commerciale. Ses membres font vivre les soirées (stories, relais, invitations) et gagnent des points qu&apos;ils échangent contre des privilèges réservés au club.</p> },
      { q: "Comment rejoindre le club ?", r: <p style={{ margin: 0 }}>Envoie une <Link href="/ambassadeurs/rejoindre">demande d&apos;accès</Link>. Chaque demande est étudiée personnellement. Si elle est retenue, tu reçois une invitation par email sous 72 h environ.</p> },
      { q: "Pourquoi ma demande n'a pas été acceptée ?", r: <p style={{ margin: 0 }}>Les places sont limitées et l&apos;équipe garde le club restreint. Tu pourras retenter ta chance plus tard, ou entrer par la recommandation d&apos;un chef d&apos;équipe.</p> },
      { q: "C'est payant ?", r: <p style={{ margin: 0 }}>Non. L&apos;accès au club est gratuit. On n&apos;y gagne pas d&apos;argent, on y gagne des privilèges.</p> },
    ],
  },
  {
    titre: "Mon accès",
    questions: [
      { q: "Comment je me connecte ?", r: <p style={{ margin: 0 }}>Sur <Link href="/ambassadeurs/connexion">lacom.club/ambassadeurs/connexion</Link>, entre ton email : tu reçois un lien de connexion. Pas de mot de passe à retenir.</p> },
      { q: "Je ne reçois pas l'email de connexion.", r: <><p style={{ margin: 0 }}>Regarde dans tes spams ou « Promotions ». L&apos;email vient de <b>xoxo@lacom.club</b> : ajoute cette adresse à tes contacts.</p><p style={{ margin: 0 }}>Vérifie aussi que tu utilises l&apos;email de ta demande d&apos;accès.</p></> },
      { q: "Mon lien ne marche plus.", r: <p style={{ margin: 0 }}>Un lien est valable une heure et ne sert qu&apos;une fois. Redemande-en un depuis la page de connexion.</p> },
      { q: "Je peux l'installer comme une app ?", r: <p style={{ margin: 0 }}>Oui. Sur iPhone : Safari, bouton Partager, « Sur l&apos;écran d&apos;accueil ». Sur Android : Chrome, menu ⋮, « Ajouter à l&apos;écran d&apos;accueil ».</p> },
    ],
  },
  {
    titre: "Missions et points",
    questions: [
      { q: "Comment je gagne des points ?", r: <p style={{ margin: 0 }}>En réalisant les missions (onglet Missions) et en faisant venir du monde avec ton code : chaque billet acheté avec ton code te rapporte des points.</p> },
      { q: "Comment j'envoie une preuve ?", r: <p style={{ margin: 0 }}>Dans Missions, touche « Envoyer ma preuve » et choisis ta capture, ta photo ou ta vidéo. Pour certaines missions, colle simplement le lien de ta publication.</p> },
      { q: "Quand mes points sont-ils crédités ?", r: <p style={{ margin: 0 }}>Dès que l&apos;équipe ou ton chef d&apos;équipe valide ta preuve, en général sous 48 h. Tu la retrouves alors dans l&apos;onglet « Validées ».</p> },
      { q: "Ma preuve a été refusée, pourquoi ?", r: <p style={{ margin: 0 }}>Le motif est écrit sur la mission. Le plus souvent : story en « amis proches », affiche coupée ou preuve trop ancienne. Corrige et renvoie une preuve, c&apos;est possible tant que la mission est ouverte.</p> },
      { q: "Mes points expirent-ils ?", r: <p style={{ margin: 0 }}>Non, ton solde reste acquis. Seul le classement du mois repart à zéro chaque début de mois.</p> },
      { q: "À quoi sert mon code membre ?", r: <p style={{ margin: 0 }}>C&apos;est ton code personnel à donner à tes proches au moment d&apos;acheter leur billet. Chaque billet acheté avec ton code te rapporte des points. Tu le retrouves sur ton accueil et sur ta carte.</p> },
    ],
  },
  {
    titre: "Privilèges",
    questions: [
      { q: "Comment débloquer un privilège ?", r: <p style={{ margin: 0 }}>Dans l&apos;onglet Privilèges, touche « Débloquer » puis « Confirmer ». Les points sont déduits de ton solde.</p> },
      { q: "Comment j'en profite ?", r: <p style={{ margin: 0 }}>Le soir de la soirée, présente-toi à l&apos;équipe de La Commerciale avec ta carte membre (onglet Ma carte). Elle te remet ton privilège.</p> },
      { q: "Je peux annuler un privilège ?", r: <p style={{ margin: 0 }}>Contacte l&apos;équipe : tant qu&apos;il n&apos;a pas été remis, elle peut l&apos;annuler et te rendre tes points.</p> },
    ],
  },
  {
    titre: "Teams",
    questions: [
      { q: "C'est quoi une team ?", r: <p style={{ margin: 0 }}>Un petit groupe de membres mené par un chef d&apos;équipe. Les teams s&apos;affrontent dans un classement mensuel. Ta team s&apos;affiche sur ton accueil.</p> },
      { q: "Comment devenir chef d'équipe ?", r: <p style={{ margin: 0 }}>Les chefs sont choisis par l&apos;équipe de La Commerciale parmi les membres les plus actifs. Fais vivre le club, ça se remarque.</p> },
    ],
  },
  {
    titre: "Mes données",
    questions: [
      { q: "Qui voit mes informations ?", r: <p style={{ margin: 0 }}>Seule l&apos;équipe de La Commerciale, et ton chef d&apos;équipe pour ce qui concerne ta team. Les autres membres ne voient que ton prénom et l&apos;initiale de ton nom dans le classement.</p> },
      { q: "Comment quitter le club ?", r: <p style={{ margin: 0 }}>Écris à l&apos;équipe de La Commerciale : ton compte et tes données seront supprimés.</p> },
    ],
  },
];

export default function Faq() {
  return (
    <div className="ecran" style={{ gap: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/ambassadeurs" style={{ fontSize: 13, color: "var(--gris)" }}>← Retour</Link>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={64} height={38} />
      </div>
      <header>
        <p className="label" style={{ margin: 0 }}>Questions fréquentes</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1.05 }}>Tout savoir sur le club.</h1>
      </header>

      {BLOCS.map((b) => (
        <section key={b.titre} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className="label-gris" style={{ margin: "0 0 4px" }}>{b.titre}</h2>
          {b.questions.map((q) => <Question key={q.q} q={q.q}>{q.r}</Question>)}
        </section>
      ))}

      <p style={{ margin: 0, fontSize: 13, color: "var(--gris)", textAlign: "center" }}>Une autre question ? Écris à l&apos;équipe de La Commerciale sur Instagram.</p>
    </div>
  );
}
