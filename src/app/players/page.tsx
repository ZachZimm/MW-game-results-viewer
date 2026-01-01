import Link from "next/link";
import { getLeaderboard, getAllPlayersData } from "@/lib/data";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils/format";

export default async function PlayersPage() {
  const [leaderboard, playersData] = await Promise.all([
    getLeaderboard(),
    getAllPlayersData(),
  ]);

  // Create a map for quick lookup
  const statsMap = new Map(playersData.map((p) => [p.player.slug, p.stats]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Players</h1>
        <p className="text-text-secondary mt-1">
          All participants in the MRE Stock Competition
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leaderboard.map((entry) => {
          const stats = statsMap.get(entry.slug);
          const returnColor =
            entry.totalReturns >= 0 ? "text-positive" : "text-negative";

          return (
            <Link
              key={entry.slug}
              href={`/players/${entry.slug}`}
              className="bg-bg-secondary rounded-lg border border-border-color p-5 hover:border-accent/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bg-tertiary text-sm font-medium">
                    {entry.place}
                  </span>
                </div>
                <span
                  className={`text-lg font-semibold tabular-nums ${returnColor}`}
                >
                  {formatPercent((entry.totalReturns / 100000) * 100)}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
                {entry.name}
              </h2>

              <div className="mt-2 text-2xl font-bold tabular-nums">
                {formatCurrency(entry.netWorth)}
              </div>

              <div className="mt-4 pt-4 border-t border-border-color grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-text-secondary">Trades</div>
                  <div className="text-sm font-medium tabular-nums">
                    {formatNumber(entry.trades)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary">Win Rate</div>
                  <div className="text-sm font-medium tabular-nums">
                    {stats?.winRate.toFixed(0) ?? "—"}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary">Days #1</div>
                  <div className="text-sm font-medium tabular-nums">
                    {stats?.daysAtRankOne ?? 0}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
