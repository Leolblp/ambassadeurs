import Nav from "../_components/Nav";
import { createClient, getUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MembreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const uid = await getUserId(supabase);
  const { data: team } = uid
    ? await supabase.from("teams").select("id").eq("leader_id", uid).maybeSingle()
    : { data: null };

  return (
    <>
      <div style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>{children}</div>
      <Nav chef={!!team} />
    </>
  );
}
