import MenuAdmin from "./MenuAdmin";
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
    { href: "/ambassadeurs/admin/ventes", label: "Ventes Yurplan", n: 0 },
    { href: "/ambassadeurs/admin/catalogue", label: "Catalogue des privilèges", n: 0 },
    { href: "/ambassadeurs/admin/missions", label: "Missions", n: 0 },
    { href: "/ambassadeurs/admin/soirees", label: "Soirées", n: 0 },
    { href: "/ambassadeurs/admin/membres", label: "Membres", n: 0 },
    { href: "/ambassadeurs/admin/equipes", label: "Équipes", n: 0 },
    { href: "/ambassadeurs/admin/notifications", label: "Notifications Wallet", n: 0 },
    { href: "/ambassadeurs/admin/whatsapp", label: "WhatsApp", n: 0 },
    { href: "/ambassadeurs/admin/guide", label: "Guide de l'équipe", n: 0 },
  ];

  return (
    <div className="admin-cadre">
      <MenuAdmin liens={liens} />
      <main className="admin-contenu">
        {children}
      </main>
    </div>
  );
}
