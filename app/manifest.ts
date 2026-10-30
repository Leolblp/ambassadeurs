import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XOXO Club · La Commerciale",
    short_name: "XOXO Club",
    description: "Le cercle privé de La Commerciale.",
    start_url: "/ambassadeurs",
    scope: "/",
    display: "standalone",
    background_color: "#0c0707",
    theme_color: "#0c0707",
    lang: "fr",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
