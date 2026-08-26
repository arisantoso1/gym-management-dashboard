import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitness | Gym Management",
  description: "Dashboard manajemen gym Fitness",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id"><body>{children}</body></html>
  );
}
