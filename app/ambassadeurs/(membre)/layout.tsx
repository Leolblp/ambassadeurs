import Nav from "../_components/Nav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MembreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: team } = user
    ? await supabase.from("teams").select("id").eq("leader_id", user.id).maybeSingle()
    : { data: null };

  return (
    <>
      <div style={{ paddingBottom: 96 }}>{children}</div>
      <Nav chef={!!team} />
    </>
  );
}
