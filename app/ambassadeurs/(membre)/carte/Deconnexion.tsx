"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Deconnexion() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
      style={{ alignSelf: "center", minHeight: 44, padding: "0 20px", background: "transparent", border: 0, color: "var(--gris)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
    >
      Se déconnecter
    </button>
  );
}
