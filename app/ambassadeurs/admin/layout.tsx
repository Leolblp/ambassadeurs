import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();

  const [preuves, demandes, remises] = await Promise.all([
    supabase.from("proofs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("access_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("redemptions").select("id", { count: "exact", head: true }).eq("status", "requested"),
  ]);

  const liens = [
    { href: "/ambassadeurs/admin", label: "Preuves", n: preuves.count ?? 0 },
    { href: "/ambassadeurs/admin/demandes", label: "Demandes d'accès", n: demandes.count ?? 0 },
    { href: "/ambassadeurs/admin/privileges", label: "Privilèges à remettre", n: remises.count ?? 0 },
    { href: "/ambassadeurs/admin/missions", label: "Missions", n: 0 },
    { href: "/ambassadeurs/admin/soirees", label: "Soirées", n: 0 },
    { href: "/ambassadeurs/admin/membres", label: "Membres", n: 0 },
    { href: "/ambassadeurs/admin/equipes", label: "Équipes", n: 0 },
    { href: "/ambassadeurs/admin/whatsapp", label: "WhatsApp", n: 0 },
    { href: "/ambassadeurs/admin/guide", label: "Guide de l'équipe", n: 0 },
  ];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexWrap: "wrap" }}>
      <aside style={{ flex: "1 1 220px", maxWidth: 280, padding: "24px 18px", borderRight: "1px solid var(--bord)", display: "flex", flexDirection: "column", gap: 24 }}>
        <Link href="/ambassadeurs/admin" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/logo-xoxo.png" alt="XOXO Club" width={72} height={43} />
          <span className="label-gris">Équipe</span>
        </Link>
        <nav aria-label="Back-office" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {liens.map((l) => (
            <Link key={l.href} href={l.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44, padding: "0 12px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              {l.label}
              {l.n > 0 && <span style={{ padding: "2px 8px", borderRadius: 99, background: "var(--rouge)", color: "var(--fond)", fontSize: 11, fontWeight: 800 }}>{l.n}</span>}
            </Link>
          ))}
        </nav>
        <Link href="/ambassadeurs" style={{ marginTop: "auto", fontSize: 13, color: "var(--gris)" }}>← Espace membre</Link>
      </aside>
      <main style={{ flex: "999 1 560px", minWidth: 0, padding: "32px clamp(16px, 3vw, 48px) 64px", display: "flex", flexDirection: "column", gap: 24 }}>
        {children}
      </main>
    </div>
  );
}
