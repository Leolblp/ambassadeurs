"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type LienAdmin = { href: string; label: string; n: number };

export default function MenuAdmin({ liens }: { liens: LienAdmin[] }) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => setOuvert(false), [chemin]);
  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [ouvert]);

  const actif = (href: string) => (href === "/ambassadeurs/admin" ? chemin === href : chemin.startsWith(href));
  const courant = liens.find((l) => actif(l.href))?.label ?? "Back-office";
  const total = liens.reduce((t, l) => t + l.n, 0);

  const liste = (
    <nav aria-label="Back-office" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {liens.map((l) => (
        <Link key={l.href} href={l.href} aria-current={actif(l.href) ? "page" : undefined} className="admin-lien">
          {l.label}
          {l.n > 0 && <span className="admin-pastille">{l.n}</span>}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Ordinateur : barre latérale */}
      <aside className="admin-cote">
        <Link href="/ambassadeurs/admin" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/logo-xoxo.png" alt="XOXO Club" width={72} height={43} />
          <span className="label-gris">Équipe</span>
        </Link>
        {liste}
        <Link href="/ambassadeurs" style={{ marginTop: "auto", fontSize: 13, color: "var(--gris)" }}>← Espace membre</Link>
      </aside>

      {/* Portable : barre du haut + menu plein écran */}
      <header className="admin-haut">
        <Link href="/ambassadeurs/admin" aria-label="Accueil du back-office" style={{ display: "flex" }}>
          <Image src="/logo-xoxo.png" alt="XOXO Club" width={56} height={33} />
        </Link>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{courant}</span>
        <button type="button" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert} aria-controls="menu-admin" className="admin-bouton">
          {ouvert ? "Fermer" : "Menu"}
          {!ouvert && total > 0 && <span className="admin-pastille">{total}</span>}
        </button>
      </header>
      {ouvert && (
        <div id="menu-admin" className="admin-tiroir">
          {liste}
          <Link href="/ambassadeurs" style={{ display: "block", padding: "20px 12px 8px", fontSize: 14, color: "var(--gris)" }}>← Espace membre</Link>
        </div>
      )}
    </>
  );
}
