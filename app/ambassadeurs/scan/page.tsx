import type { Metadata } from "next";
import { requireScan } from "@/lib/admin";
import { soireeDuJour } from "@/lib/fidelite";
import { createAdminClient } from "@/lib/supabase/admin";
import Scanner from "./Scanner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scan · La Commerciale" };

export default async function Scan() {
  const { profil } = await requireScan();
  const soiree = soireeDuJour();
  const { data } = await createAdminClient().from("fid_usages").select("avantage").eq("soiree_date", soiree);
  const n = (a: string) => (data ?? []).filter((l) => l.avantage === a).length;
  return (
    <div className="ecran" style={{ gap: 16, minHeight: "100dvh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <p className="label" style={{ margin: 0 }}>Scan carte · {new Date(soiree + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="serif" style={{ margin: "4px 0 0", fontSize: 30 }}>Bonsoir {profil.first_name ?? ""}.</h1>
        </div>
        {profil.role === "admin" && <a href="/ambassadeurs/admin" className="label-gris" style={{ textDecoration: "none" }}>Admin</a>}
      </div>
      <p className="label-gris" style={{ margin: 0 }}>Ce soir : {n("coupe_file")} coupe-file · {n("shot")} shots · {n("anniv")} anniv</p>
      <Scanner />
    </div>
  );
}
