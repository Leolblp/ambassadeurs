import type { Metadata } from "next";
import Inscription from "./Inscription";

export const metadata: Metadata = {
  title: "La carte · La Commerciale",
  description: "La carte gratuite de La Commerciale : coupe-file, un shot offert à chaque soirée et une surprise pour ton anniversaire.",
};

export default function PageCarte() {
  return <Inscription />;
}
