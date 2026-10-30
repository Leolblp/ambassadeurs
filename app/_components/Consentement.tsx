"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const CLE = "xoxo-consentement";
const GA = "G-2CHM5HR6Q7";
const VALIDITE = 182 * 24 * 3600 * 1000; // 6 mois, puis on redemande (recommandation CNIL)

type Choix = "oui" | "non";

function lire(): Choix | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) ?? "null") as { choix: Choix; date: number } | null;
    if (!v || Date.now() - v.date > VALIDITE) return null;
    return v.choix;
  } catch {
    return null;
  }
}

/** Ouvre à nouveau le bandeau (lien « Gérer les cookies »). */
export function rouvrirConsentement() {
  window.dispatchEvent(new Event("xoxo-cookies"));
}

export default function Consentement() {
  const [choix, setChoix] = useState<Choix | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const c = lire();
    setChoix(c);
    setVisible(c === null);
    const ouvrir = () => setVisible(true);
    window.addEventListener("xoxo-cookies", ouvrir);
    return () => window.removeEventListener("xoxo-cookies", ouvrir);
  }, []);

  function enregistrer(c: Choix) {
    try { localStorage.setItem(CLE, JSON.stringify({ choix: c, date: Date.now() })); } catch {}
    if (c === "non" && choix === "oui") {
      // Retrait du consentement : on efface les cookies Google Analytics et on recharge sans eux
      document.cookie.split(";").map((x) => x.trim().split("=")[0]).filter((n) => n.startsWith("_ga"))
        .forEach((n) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=.${location.hostname}`; document.cookie = `${n}=; Max-Age=0; path=/`; });
      location.reload();
      return;
    }
    setChoix(c);
    setVisible(false);
  }

  return (
    <>
      {choix === "oui" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA}');`}
          </Script>
        </>
      )}

      {visible && (
        <div role="dialog" aria-modal="false" aria-labelledby="cookies-titre" className="cookies">
          <p id="cookies-titre" style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Mesure d&apos;audience</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--gris)" }}>
            On aimerait utiliser Google Analytics pour comprendre comment le site est utilisé. Ces cookies ne sont déposés qu&apos;avec ton accord,
            et tu peux changer d&apos;avis à tout moment. <a href="/ambassadeurs/confidentialite" style={{ color: "var(--encre)" }}>En savoir plus</a>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <button type="button" className="btn" onClick={() => enregistrer("non")} style={{ minHeight: 48, padding: 0, background: "transparent", color: "var(--encre)", border: "1px solid var(--bord)" }}>Refuser</button>
            <button type="button" className="btn" onClick={() => enregistrer("oui")} style={{ minHeight: 48, padding: 0, background: "transparent", color: "var(--encre)", border: "1px solid var(--bord)" }}>Accepter</button>
          </div>
        </div>
      )}
    </>
  );
}

export function LienCookies({ style }: { style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={rouvrirConsentement} style={{ background: "none", border: 0, padding: 0, color: "var(--gris)", font: "inherit", textDecoration: "underline", cursor: "pointer", ...style }}>
      Gérer les cookies
    </button>
  );
}
