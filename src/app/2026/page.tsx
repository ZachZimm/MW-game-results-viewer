import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";

const DATA_DIR = path.join(process.cwd(), "data");

async function getNextGameInfo() {
  try {
    const filePath = path.join(DATA_DIR, "next-game.csv");
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.trim().split("\n");
    const url = lines[0] || "";
    const password = lines[1]?.replace("Password: ", "") || "";
    return { url, password };
  } catch {
    return null;
  }
}

export default async function NextGamePage() {
  const gameInfo = await getNextGameInfo();

  if (!gameInfo) {
    return (
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">2026 Game</h1>
        <p className="text-text-secondary mt-1">
          Next game information not available
        </p>
      </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">2026 Game</h1>
        <p className="text-text-secondary mt-1">
          Join the next West is the Best Stock Game
        </p>
      </div>

      <div className="bg-bg-secondary rounded-lg border border-border-color p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              Join the 2026 West is the Best Stock Game
            </h2>
            <p className="text-text-secondary">
              Ready to compete again? Join the next season of The West is the Best stock market game!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">
                Game Link
              </label>
              <div className="flex items-center gap-2">
                <Link
                  href={gameInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 underline break-all"
                >
                  {gameInfo.url}
                </Link>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">
                Password
              </label>
              <div className="bg-bg-tertiary rounded-md px-4 py-2 border border-border-color">
                <code className="text-text-primary font-mono text-lg">
                  {gameInfo.password}
                </code>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-color">
            <Link
              href={gameInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-colors"
            >
              Join Game
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
