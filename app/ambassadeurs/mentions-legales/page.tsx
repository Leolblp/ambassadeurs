import { Bloc, PageLegale, p0 } from "../_components/PageLegale";

export const metadata = { title: "Mentions légales · XOXO Club" };

export default function MentionsLegales() {
  return (
    <PageLegale sur="Informations" titre="Mentions légales" maj="20 octobre 2026">
      <Bloc titre="Éditeur">
        <p style={p0}>
          Le site lacom.club et le XOXO Club sont édités par <b>MBC EVENTS</b>, société par actions simplifiée unipersonnelle (SASU) au capital de 1 000 €,
          immatriculée au RCS de Lyon sous le numéro 851 503 961.
        </p>
        <p style={p0}>
          Siège social : 33 avenue Jean Jaurès, 69370 Saint-Didier-au-Mont-d&apos;Or, France<br />
          SIRET : 851 503 961 00019 · TVA intracommunautaire : FR17851503961<br />
          Contact : <a href="mailto:xoxo@lacom.club">xoxo@lacom.club</a>
        </p>
        <p style={p0}>Directeur de la publication : Aaron Ajzenberg, Président.</p>
      </Bloc>

      <Bloc titre="Hébergement">
        <p style={p0}>
          Site : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com). Serveurs d&apos;exécution situés à Dublin (Irlande).
        </p>
        <p style={p0}>
          Données et fichiers : Supabase Inc., 970 Toa Payoh North #07-04, Singapour 318992 (supabase.com). Données hébergées dans la région Union européenne (Irlande).
        </p>
      </Bloc>

      <Bloc titre="Propriété intellectuelle">
        <p style={p0}>
          Les marques La Commerciale et XOXO Club, les logos, visuels et textes de ce site sont la propriété de MBC EVENTS ou de ses partenaires.
          Toute reproduction sans autorisation écrite est interdite.
        </p>
      </Bloc>

      <Bloc titre="Accès au club">
        <p style={p0}>
          Le XOXO Club est réservé aux personnes majeures. L&apos;accès est gratuit, sur invitation, et peut être suspendu ou retiré par MBC EVENTS en cas de
          non-respect de l&apos;esprit du club ou de fraude (preuves falsifiées, comptes multiples). Les points n&apos;ont aucune valeur monétaire, ne sont ni
          échangeables contre de l&apos;argent ni cessibles, et les privilèges sont soumis à disponibilité.
        </p>
      </Bloc>

      <Bloc titre="Données personnelles">
        <p style={p0}>
          Le traitement de tes données est décrit dans la <a href="/ambassadeurs/confidentialite">politique de confidentialité</a>.
        </p>
      </Bloc>
    </PageLegale>
  );
}
