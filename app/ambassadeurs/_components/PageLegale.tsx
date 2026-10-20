import Image from "next/image";
import Link from "next/link";

export function PageLegale({ sur, titre, maj, children }: { sur: string; titre: string; maj: string; children: React.ReactNode }) {
  return (
    <div className="ecran" style={{ gap: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/ambassadeurs" style={{ fontSize: 13, color: "var(--gris)" }}>← Retour</Link>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={64} height={38} />
      </div>
      <header>
        <p className="label" style={{ margin: 0 }}>{sur}</p>
        <h1 className="serif" style={{ margin: "6px 0 0", fontSize: 38, lineHeight: 1.05 }}>{titre}</h1>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--gris)" }}>Dernière mise à jour : {maj}</p>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, fontSize: 14, lineHeight: 1.65 }}>{children}</div>
      <p style={{ margin: 0, fontSize: 12, color: "var(--gris)", textAlign: "center" }}>
        <Link href="/ambassadeurs/mentions-legales" style={{ color: "var(--gris)" }}>Mentions légales</Link> · <Link href="/ambassadeurs/confidentialite" style={{ color: "var(--gris)" }}>Confidentialité</Link> · <Link href="/ambassadeurs/faq" style={{ color: "var(--gris)" }}>FAQ</Link>
      </p>
    </div>
  );
}

export function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 className="label-gris" style={{ margin: 0 }}>{titre}</h2>
      {children}
    </section>
  );
}

export const p0: React.CSSProperties = { margin: 0 };
