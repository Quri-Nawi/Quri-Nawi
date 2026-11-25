import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { project } from "../lib/project";
import "./globals.css";

export const metadata: Metadata = {
  title: project.name,
  description: project.description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/app-192.png",
    apple: "/brand/app-192.png",
  },
};

export const viewport: Viewport = { themeColor: "#173b31" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-BO">
      <body>{children}</body>
    </html>
  );
}
