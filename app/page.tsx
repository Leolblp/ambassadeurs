import Image from "next/image";
import Link from "next/link";
import { LienCookies } from "./_components/Consentement";

export default function Entree() {
  return (
    <div className="grain" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute", left: "50%", top: "42%", width: 900, height: 900,
          marginLeft: -450, marginTop: -450, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(closest-side, rgba(255,26,26,.22), rgba(255,26,26,.06) 55%, transparent 75%)",
        }}
      />

      <header style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, padding: "28px clamp(20px, 4vw, 56px)", borderBottom: "1px solid var(--bord)" }}>
        <span className="label-gris" style={{ fontSize: 12, letterSpacing: ".22em" }}>La Commerciale · Lyon</span>
        <Link href="/ambassadeurs" className="label-gris" style={{ fontSize: 12, color: "var(--encre)", textDecoration: "none" }}>Espace membre</Link>
      </header>

      <main style={{ position: "relative", flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 28, padding: "64px 20px 72px" }}>
        <p className="label" style={{ margin: 0, letterSpacing: ".28em" }}>Le cercle privé de La Commerciale</p>
        <h1 style={{ margin: 0, width: "min(560px, 86vw)" }}>
          <Image src="/logo-xoxo.png" alt="XOXO Club" width={1454} height={862} priority style={{ width: "100%", height: "auto" }} />
        </h1>
        <p className="serif" style={{ margin: 0, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.1 }}>Sur invitation uniquement.</p>
        <p style={{ margin: 0, maxWidth: 480, fontSize: 17, lineHeight: 1.6, color: "var(--gris)" }}>
          Un cercle restreint de personnes qui font vivre les nuits de La Commerciale. Des missions, des privilèges, des accès que personne d&apos;autre n&apos;a.
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 8 }}>
          <Link href="/ambassadeurs/rejoindre" className="btn" style={{ minHeight: 56, padding: "0 36px", fontSize: 14 }}>
            Demander mon accès
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
          <Link href="/ambassadeurs" style={{ fontSize: 14, color: "var(--gris)" }}>Déjà membre ? Entrer</Link>
        </div>
      </main>

      <footer className="label-gris" style={{ position: "relative", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "14px 40px", padding: "24px 20px 32px", borderTop: "1px solid var(--bord)", fontSize: 11, letterSpacing: ".22em" }}>
        <span>Accès sur sélection</span>
        <span aria-hidden="true" style={{ color: "var(--rouge)" }}>✕</span>
        <span>Places limitées</span>
        <span aria-hidden="true" style={{ color: "var(--rouge)" }}>✕</span>
        <span>Privilèges réservés aux membres</span>
        <span style={{ flexBasis: "100%", textAlign: "center", letterSpacing: ".08em", textTransform: "none" }}>
          <Link href="/ambassadeurs/mentions-legales" style={{ color: "var(--gris)" }}>Mentions légales</Link> · <Link href="/ambassadeurs/confidentialite" style={{ color: "var(--gris)" }}>Confidentialité</Link> · <LienCookies />
        </span>
      </footer>
    </div>
  );
}
