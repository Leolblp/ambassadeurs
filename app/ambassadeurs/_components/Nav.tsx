"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/ambassadeurs", label: "Club", d: ["M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"] },
  { href: "/ambassadeurs/missions", label: "Missions", d: ["M9 11l3 3 8-8", "M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"] },
  { href: "/ambassadeurs/privileges", label: "Privilèges", d: ["M20 12v9H4v-9", "M2 7h20v5H2z", "M12 21V7", "M12 7c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"] },
  { href: "/ambassadeurs/carte", label: "Ma carte", d: ["M3 5h18v14H3z", "M7 15h4M7 11h2"] },
];

const TEAM = { href: "/ambassadeurs/equipe", label: "Ma team", d: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 0 .01", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"] };

export default function Nav({ chef = false }: { chef?: boolean }) {
  const path = usePathname();
  const items = chef ? [...ITEMS.slice(0, 3), TEAM, ITEMS[3]] : ITEMS;
  return (
    <nav
      aria-label="Navigation du club"
      className="nav-bas"
    >
      <div style={{ maxWidth: 480, margin: "0 auto", display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, padding: "8px 8px 12px" }}>
        {items.map((it) => {
          const actif = it.href === "/ambassadeurs" ? path === it.href : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={actif ? "page" : undefined}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 48,
                textDecoration: "none", color: actif ? "var(--rouge)" : "var(--gris)",
                fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {it.d.map((d) => <path key={d} d={d} />)}
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
