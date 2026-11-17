import type { Metadata } from "next";
import Inscription from "./Inscription";

export const metadata: Metadata = {
  title: "La carte · La Commerciale",
  description: "La carte gratuite de La Commerciale : coupe-file à chaque soirée et des offres surprises réservées aux détenteurs de la carte.",
};

export default function PageCarte() {
  return <Inscription />;
}
