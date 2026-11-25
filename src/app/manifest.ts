import type { MetadataRoute } from "next";
import { project } from "../lib/project";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: project.name,
    short_name: project.name,
    description: project.description,
    lang: "es-BO",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f5ed",
    theme_color: "#173b31",
    icons: [
      { src: "/brand/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/app-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
