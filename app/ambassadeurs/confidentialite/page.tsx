import { Bloc, PageLegale, p0 } from "../_components/PageLegale";

export const metadata = { title: "Confidentialité · XOXO Club" };

const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--bord)", verticalAlign: "top", textAlign: "left" };

export default function Confidentialite() {
  return (
    <PageLegale sur="Tes données" titre="Politique de confidentialité" maj="20 octobre 2026">
      <Bloc titre="Qui est responsable ?">
        <p style={p0}>
          MBC EVENTS (SASU, RCS Lyon 851 503 961), 33 avenue Jean Jaurès, 69370 Saint-Didier-au-Mont-d&apos;Or, qui exploite La Commerciale et le XOXO Club.
          Pour toute question ou demande : <a href="mailto:xoxo@lacom.club">xoxo@lacom.club</a>.
        </p>
      </Bloc>

      <Bloc titre="Quelles données ?">
        <p style={p0}>
          Prénom, nom, email, numéro de téléphone, compte Instagram, motivation (demande d&apos;accès) ; numéro de membre, code membre, team, points et
          historique ; captures et liens envoyés comme preuves de mission ; privilèges débloqués ; informations techniques de connexion.
          Si tu ajoutes ta carte à Apple Wallet ou Google Wallet : un identifiant d&apos;appareil anonyme fourni par Apple, ou l&apos;identifiant de ta carte chez Google.
        </p>
      </Bloc>

      <Bloc titre="Pourquoi et sur quelle base ?">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr><th style={td}>Finalité</th><th style={td}>Base légale</th></tr></thead>
            <tbody>
              <tr><td style={td}>Étudier ta demande d&apos;accès, gérer ton compte, tes missions, tes points et tes privilèges</td><td style={td}>Exécution de ton adhésion au club</td></tr>
              <tr><td style={td}>Te connecter (code par WhatsApp ou lien par email)</td><td style={td}>Exécution de ton adhésion</td></tr>
              <tr><td style={td}>T&apos;envoyer les messages du club sur WhatsApp (missions, rappels, points)</td><td style={td}>Ton consentement, retirable à tout moment dans Ma carte</td></tr>
              <tr><td style={td}>Mettre à jour ta carte Wallet et t&apos;envoyer ses notifications</td><td style={td}>Ton consentement (ajout de la carte), retirable en la supprimant</td></tr>
              <tr><td style={td}>Lutter contre la fraude (preuves falsifiées, comptes multiples)</td><td style={td}>Intérêt légitime de MBC EVENTS</td></tr>
            </tbody>
          </table>
        </div>
        <p style={p0}>Tes données ne sont jamais vendues et ne servent pas à de la publicité ciblée.</p>
      </Bloc>

      <Bloc titre="Qui y a accès ?">
        <p style={p0}>
          L&apos;équipe de La Commerciale, et ton chef d&apos;équipe pour ce qui concerne ta team. Les autres membres voient seulement ton prénom et
          l&apos;initiale de ton nom dans les classements.
        </p>
        <p style={p0}>
          Prestataires techniques, qui traitent les données pour notre compte : Vercel (hébergement), Supabase (base de données, Union européenne),
          Meta (WhatsApp), Resend (emails), Apple et Google (cartes Wallet). Certains sont établis aux États-Unis : les transferts sont encadrés par le
          Data Privacy Framework UE-États-Unis ou par les clauses contractuelles types de la Commission européenne.
        </p>
      </Bloc>

      <Bloc titre="Combien de temps ?">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Compte membre : tant que tu es membre. Supprimé sur simple demande, ou après 3 ans sans connexion.</li>
          <li>Captures et vidéos de preuve : supprimées automatiquement 5 jours après la soirée concernée.</li>
          <li>Demande d&apos;accès refusée : supprimée après 12 mois.</li>
          <li>Journal technique des messages WhatsApp : 12 mois.</li>
        </ul>
      </Bloc>

      <Bloc titre="Tes droits">
        <p style={p0}>
          Tu peux accéder à tes données, les corriger, les faire supprimer, t&apos;opposer à leur traitement, en limiter l&apos;usage et en demander une copie
          (portabilité). Écris à <a href="mailto:xoxo@lacom.club">xoxo@lacom.club</a> : on te répond sous un mois. Tu peux aussi saisir la CNIL (cnil.fr).
        </p>
      </Bloc>

      <Bloc titre="Cookies">
        <p style={p0}>
          Le site utilise uniquement les cookies nécessaires à ta connexion. Aucun cookie publicitaire ni de mesure d&apos;audience : aucun bandeau de
          consentement n&apos;est donc nécessaire.
        </p>
      </Bloc>
    </PageLegale>
  );
}
