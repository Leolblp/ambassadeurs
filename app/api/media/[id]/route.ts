import { NextResponse, type NextRequest } from "next/server";
import { createClient, getUserId } from "@/lib/supabase/server";
import { kitDrive } from "@/lib/drive";
import { dossierDrive } from "@/lib/partage";

export const maxDuration = 60;

/**
 * Vidéo du kit d'une soirée, relayée depuis Google Drive pour pouvoir la lire et la partager directement
 * (Drive bloque le téléchargement depuis une autre page). Réservé aux membres connectés,
 * et uniquement pour les fichiers des dossiers des soirées à venir.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!(await getUserId(supabase))) return new NextResponse(null, { status: 401 });
  const { data: soirees } = await supabase.from("events").select("description").gte("starts_at", new Date(Date.now() - 10 * 3600e3).toISOString());
  const dossiers = [...new Set((soirees ?? []).map((s) => dossierDrive(s.description)?.id).filter(Boolean))] as string[];
  const kits = await Promise.all(dossiers.map((d) => kitDrive(d).catch(() => [])));
  const media = kits.flat().find((m) => m.id === id);
  if (!media) return new NextResponse(null, { status: 404 });

  const r = await fetch(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`, { cache: "no-store" });
  if (!r.ok || !r.body) return new NextResponse(null, { status: 502 });
  const type = r.headers.get("content-type") ?? "application/octet-stream";
  if (type.includes("text/html")) return new NextResponse(null, { status: 502 }); // page d'erreur Drive
  return new NextResponse(r.body, {
    headers: {
      "Content-Type": type,
      ...(r.headers.get("content-length") ? { "Content-Length": r.headers.get("content-length")! } : {}),
      "Content-Disposition": `${request.nextUrl.searchParams.get("dl") ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(media.nom)}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
