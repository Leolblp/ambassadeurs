import "server-only";
import http2 from "node:http2";
import { PKPass } from "passkit-generator";
import { createAdminClient } from "@/lib/supabase/admin";
import { IMAGES } from "./images";

export const PASS_TYPE = "pass.club.lacom.xoxo";
const TEAM_ID = "PZB3FK3H3B";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lacom.club";

type Bundle = { cert: string; key: string; wwdr: string; push: string };
let cache: Bundle | null = null;
export function bundle(): Bundle {
  if (cache) return cache;
  const brut = process.env.WALLET_BUNDLE;
  if (!brut) throw new Error("WALLET_BUNDLE absent sur Vercel");
  cache = JSON.parse(Buffer.from(brut, "base64").toString("utf8")) as Bundle;
  return cache;
}

/** Crée (une fois) la carte du membre : numéro de série + jeton d'authentification. */
export async function carteDuMembre(memberId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("wallet_passes").select("serial, auth_token, updated_at").eq("member_id", memberId).maybeSingle();
  if (data) return data;
  const { data: cree, error } = await admin.from("wallet_passes").insert({ member_id: memberId }).select("serial, auth_token, updated_at").single();
  if (error) throw error;
  return cree;
}

const pts = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ");

/** Génère le fichier .pkpass à jour (solde, prochain privilège, team). */
export async function genererPass(memberId: string): Promise<Buffer> {
  const admin = createAdminClient();
  const [carte, { data: p }, { data: solde }, { data: privileges }] = await Promise.all([
    carteDuMembre(memberId),
    admin.from("profiles").select("first_name, last_name, member_number, promo_code, created_at, teams!profiles_team_id_fkey(name)").eq("id", memberId).single(),
    admin.rpc("member_balance", { p_member: memberId }),
    admin.from("privileges").select("name, cost").eq("is_active", true).order("cost"),
  ]);
  if (!p) throw new Error("Membre introuvable");
  const points = Number(solde ?? 0);
  const prochain = (privileges ?? []).find((x) => x.cost > points);
  const nom = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Membre";
  const numero = String(p.member_number ?? 0).padStart(3, "0");
  const team = (p.teams as unknown as { name: string } | null)?.name;
  const b = bundle();

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE,
    teamIdentifier: TEAM_ID,
    serialNumber: carte.serial,
    authenticationToken: carte.auth_token,
    webServiceURL: `${SITE}/api/wallet`,
    organizationName: "La Commerciale",
    description: "Carte membre XOXO Club",
    logoText: "XOXO CLUB",
    backgroundColor: "rgb(12, 7, 7)",
    foregroundColor: "rgb(245, 235, 235)",
    labelColor: "rgb(255, 26, 26)",
    sharingProhibited: true,
    storeCard: {
      headerFields: [{ key: "points", label: "POINTS", value: points, changeMessage: "Ton solde XOXO Club : %@ points" }],
      primaryFields: [{ key: "nom", label: "MEMBRE", value: nom }],
      secondaryFields: [
        { key: "numero", label: "N°", value: numero },
        ...(p.promo_code ? [{ key: "code", label: "CODE MEMBRE", value: p.promo_code }] : []),
      ],
      auxiliaryFields: [
        ...(team ? [{ key: "team", label: "TEAM", value: team }] : []),
        prochain
          ? { key: "prochain", label: "PROCHAIN PRIVILÈGE", value: `${prochain.name} · encore ${pts(prochain.cost - points)} pts` }
          : { key: "prochain", label: "PRIVILÈGES", value: "Tous accessibles" },
      ],
      backFields: [
        { key: "espace", label: "Ton espace membre", value: `${SITE}/ambassadeurs`, attributedValue: `<a href="${SITE}/ambassadeurs">Ouvrir mon espace</a>` },
        { key: "usage", label: "Comment l'utiliser", value: "Présente cette carte à l'équipe de La Commerciale pour profiter de tes privilèges. Ton solde se met à jour automatiquement." },
        { key: "depuis", label: "Membre depuis", value: new Date(p.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) },
        { key: "perso", label: "Strictement personnelle", value: "Cette carte est nominative et ne peut pas être partagée." },
      ],
    },
    barcodes: [{ format: "PKBarcodeFormatQR", message: `XOXO-${numero}-${carte.serial.slice(0, 8)}`, messageEncoding: "iso-8859-1", altText: `N° ${numero}` }],
  };

  const fichiers: Record<string, Buffer> = { "pass.json": Buffer.from(JSON.stringify(passJson)) };
  for (const [k, v] of Object.entries(IMAGES)) fichiers[k] = Buffer.from(v, "base64");
  const pass = new PKPass(fichiers, { wwdr: b.wwdr, signerCert: b.cert, signerKey: b.key });
  return pass.getAsBuffer();
}

/** Prévient les iPhone qui ont la carte : ils viennent chercher la nouvelle version. */
export async function pousserCarte(memberId: string) {
  const admin = createAdminClient();
  const { data: carte } = await admin.from("wallet_passes").update({ updated_at: new Date().toISOString() }).eq("member_id", memberId).select("serial").maybeSingle();
  if (!carte) return 0;
  const { data: regs } = await admin.from("wallet_registrations").select("device_id, push_token").eq("serial", carte.serial);
  if (!regs?.length) return 0;
  const b = bundle();
  const client = http2.connect("https://api.push.apple.com:443", { cert: b.cert, key: b.key });
  let ok = 0;
  try {
    await Promise.all(
      regs.map(
        (r) =>
          new Promise<void>((resolve) => {
            const req = client.request({ ":method": "POST", ":path": `/3/device/${r.push_token}`, "apns-topic": PASS_TYPE, "content-type": "application/json" });
            req.on("response", async (h) => {
              const statut = Number(h[":status"]);
              if (statut === 200) ok++;
              if (statut === 410) await admin.from("wallet_registrations").delete().eq("device_id", r.device_id).eq("serial", carte.serial);
            });
            req.on("close", () => resolve());
            req.on("error", () => resolve());
            req.end("{}");
          }),
      ),
    );
  } finally {
    client.close();
  }
  return ok;
}
