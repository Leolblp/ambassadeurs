"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Arrivée depuis l'email d'invitation (modèle Supabase par défaut) :
 * la session arrive dans l'ancre de l'URL (#access_token=...).
 */
export default function Bienvenue() {
  const router = useRouter();
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const code = new URLSearchParams(window.location.search).get("code");
    const supabase = createClient();

    (async () => {
      let ok = false;
      if (access_token && refresh_token) {
        ok = !(await supabase.auth.setSession({ access_token, refresh_token })).error;
      } else if (code) {
        ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
      } else {
        ok = !!(await supabase.auth.getUser()).data.user;
      }
      if (ok) {
        router.replace("/ambassadeurs/carte");
        router.refresh();
      } else {
        setErreur(true);
      }
    })();
  }, [router]);

  return (
    <div className="ecran grain" style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: 20 }}>
      <Image src="/logo-xoxo.png" alt="XOXO Club" width={180} height={107} priority />
      {erreur ? (
        <>
          <p className="serif" style={{ margin: 0, fontSize: 32 }}>Ce lien a expiré.</p>
          <a className="btn" href="/ambassadeurs/connexion">Recevoir un nouveau lien</a>
        </>
      ) : (
        <>
          <p className="label" style={{ margin: 0 }}>Demande acceptée</p>
          <p className="serif" style={{ margin: 0, fontSize: 40, lineHeight: 1 }}>Bienvenue dans le club.</p>
        </>
      )}
    </div>
  );
}
