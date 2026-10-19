import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccueilMembre() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ambassadeurs/connexion");

  const [{ data: profil }, { data: solde }] = await Promise.all([
    supabase.from("profiles").select("first_name, member_number, promo_code").eq("id", user.id).single(),
    supabase.rpc("member_balance", { p_member: user.id }),
  ]);

  return (
    <div className="ecran" style={{ gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Image src="/logo-xoxo.png" alt="XOXO Club" width={64} height={38} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{profil?.first_name ?? "Membre"}</div>
          <div className="label-gris" style={{ fontSize: 9 }}>Membre N° {String(profil?.member_number ?? "").padStart(3, "0")}</div>
        </div>
      </div>

      <section className="carte" style={{ padding: 20 }}>
        <div className="label-gris">Tes points</div>
        <div className="display" style={{ fontSize: 56, lineHeight: 1, marginTop: 6 }}>
          {(solde ?? 0).toLocaleString("fr-FR")}
        </div>
      </section>

      {profil?.promo_code && (
        <section style={{ padding: "14px 16px", border: "1px dashed var(--bord-rouge)", borderRadius: 16 }}>
          <div className="label-gris">Ton code membre</div>
          <div className="display" style={{ fontSize: 22, letterSpacing: ".08em", marginTop: 2 }}>{profil.promo_code}</div>
        </section>
      )}

      <p style={{ color: "var(--gris)", fontSize: 14 }}>Missions, privilèges et classement arrivent à l&apos;étape suivante.</p>
    </div>
  );
}
