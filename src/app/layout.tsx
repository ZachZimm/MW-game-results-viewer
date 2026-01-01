import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { promises as fs } from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "West is the Best Stock Game Results Viewer",
  description: "The West is the Best Stock Market Game results viewer",
  icons: {
    icon: "/favicon.png", // or "/icon.png", "/icon.svg", etc.
  },
};

async function checkNextGameFile(): Promise<boolean> {
  try {
    const DATA_DIR = path.join(process.cwd(), "data");
    const filePath = path.join(DATA_DIR, "next-game.csv");
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showNextGame = await checkNextGameFile();

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-bg-primary">
        <Header showNextGame={showNextGame} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
