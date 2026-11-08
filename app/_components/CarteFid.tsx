import Image from "next/image";

/** Carte La Commerciale : reflet animé, bord rouge, logo XOXO. Utilisée sur l'accueil, l'inscription et « Ma carte ». */
export default function CarteFid({
  nom = "Ton nom ici",
  numero = "000",
  niveau = "Membre",
  depuis,
  qr,
  anim = true,
}: {
  nom?: string;
  numero?: string;
  niveau?: string;
  depuis?: string;
  qr?: string;
  anim?: boolean;
}) {
  return (
    <div className={`carte-fid${anim ? " carte-fid-anim" : ""}`}>
      <div className="carte-fid-reflet" aria-hidden="true" />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={96} height={57} />
        <div className="label-gris" style={{ textAlign: "right" }}>
          {niveau}
          <br />
          <span className="display" style={{ fontSize: 26, letterSpacing: ".04em", color: "var(--encre)" }}>N° {numero}</span>
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div className="display" style={{ fontSize: 22, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nom}</div>
          <div style={{ fontSize: 11, color: "var(--gris)", marginTop: 2 }}>{depuis ? `Membre depuis ${depuis}` : "Coupe-file · Shot · Anniversaire"}</div>
        </div>
        {qr ? (
          <div className="carte-fid-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        ) : (
          <div className="label" style={{ fontSize: 11, whiteSpace: "nowrap" }}>La Commerciale</div>
        )}
      </div>
    </div>
  );
}
