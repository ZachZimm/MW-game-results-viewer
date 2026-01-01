import {
  getLeaderboard,
  getAllPlayersData,
  calculateDailyReturns,
} from "@/lib/data";
import { calculateStreaks } from "@/lib/data/stats";
import { PLAYER_COLORS } from "@/lib/constants";
import { formatCurrency, formatPercent, formatDate, formatNumber } from "@/lib/utils/format";

export default async function InsightsPage() {
  const [leaderboard, allPlayersData] = await Promise.all([
    getLeaderboard(),
    getAllPlayersData(),
  ]);

  // Find records
  const allDailyReturns = allPlayersData.flatMap((player) => {
    const returns = calculateDailyReturns(player.performance);
    return returns.map((r) => ({ ...r, player: player.player.name }));
  });

  const bestDay = allDailyReturns.reduce(
    (best, curr) => (curr.change > best.change ? curr : best),
    allDailyReturns[0]
  );

  const worstDay = allDailyReturns.reduce(
    (worst, curr) => (curr.change < worst.change ? curr : worst),
    allDailyReturns[0]
  );

  // Longest streaks across all players
  const allStreaks = allPlayersData.map((player) => {
    const returns = calculateDailyReturns(player.performance);
    const streaks = calculateStreaks(returns);
    return { player: player.player.name, ...streaks };
  });

  const longestWinStreak = allStreaks.reduce(
    (best, curr) =>
      curr.longestWinStreak > best.longestWinStreak ? curr : best,
    allStreaks[0]
  );

  const longestLoseStreak = allStreaks.reduce(
    (worst, curr) =>
      curr.longestLoseStreak > worst.longestLoseStreak ? curr : worst,
    allStreaks[0]
  );

  // Find the most active trader
  const mostActiveTrader = allPlayersData.reduce((prev, curr) =>
    curr.stats.totalTrades > prev.stats.totalTrades ? curr : prev
  );

  // Find most and least volatile
  const mostVolatile = allPlayersData.reduce((prev, curr) =>
    curr.stats.volatility > prev.stats.volatility ? curr : prev
  );

  const leastVolatile = allPlayersData.reduce((prev, curr) =>
    curr.stats.volatility < prev.stats.volatility ? curr : prev
  );

  // Find longest leader (most days at rank 1)
  const longestLeader = allPlayersData.reduce((prev, curr) =>
    curr.stats.daysAtRankOne > prev.stats.daysAtRankOne ? curr : prev
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Insights</h1>
        <p className="text-text-secondary mt-1">
          Records, patterns, and interesting findings
        </p>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <div className="text-sm text-text-secondary mb-1">Best Single Day</div>
          <div className="text-2xl font-bold text-positive tabular-nums">
            {bestDay ? formatCurrency(bestDay.change) : "—"}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {bestDay?.player} • {bestDay ? formatDate(bestDay.date) : ""}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <div className="text-sm text-text-secondary mb-1">Worst Single Day</div>
          <div className="text-2xl font-bold text-negative tabular-nums">
            {worstDay ? formatCurrency(worstDay.change) : "—"}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {worstDay?.player} • {worstDay ? formatDate(worstDay.date) : ""}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <div className="text-sm text-text-secondary mb-1">Longest Win Streak</div>
          <div className="text-2xl font-bold text-positive tabular-nums">
            {longestWinStreak?.longestWinStreak || 0} days
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {longestWinStreak?.player}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <div className="text-sm text-text-secondary mb-1">Longest Lose Streak</div>
          <div className="text-2xl font-bold text-negative tabular-nums">
            {longestLoseStreak?.longestLoseStreak || 0} days
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {longestLoseStreak?.player}
          </div>
        </div>
      </div>

      {/* Additional Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <div className="text-sm text-text-secondary mb-1">Most Active Trader</div>
          <div className="text-2xl font-bold text-accent tabular-nums">
            {formatNumber(mostActiveTrader.stats.totalTrades)}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {mostActiveTrader.player.name}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <div className="text-sm text-text-secondary mb-1">Most Volatile</div>
          <div className="text-2xl font-bold text-negative tabular-nums">
            {formatPercent(mostVolatile.stats.volatility, 1)}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {mostVolatile.player.name} daily σ
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <div className="text-sm text-text-secondary mb-1">Least Volatile</div>
          <div className="text-2xl font-bold text-positive tabular-nums">
            {formatPercent(leastVolatile.stats.volatility, 1)}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {leastVolatile.player.name} daily σ
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <div className="text-sm text-text-secondary mb-1">Longest Leader</div>
          <div className="text-2xl font-bold text-accent tabular-nums">
            {longestLeader.stats.daysAtRankOne} days
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {longestLeader.player.name}
          </div>
        </div>
      </div>

      {/* Dramatic Reversals */}
      <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
          Dramatic Reversals
        </h3>
        <div className="space-y-4">
          {allPlayersData
            .map((player) => {
              return {
                name: player.player.name,
                peak: player.stats.peakNetWorth,
                peakDate: player.stats.peakDate,
                current: player.stats.currentNetWorth,
                maxDrawdownPercent: player.stats.maxDrawdownPercent,
                peakReturn:
                  ((player.stats.peakNetWorth - 100000) / 100000) * 100,
                currentReturn: player.stats.totalReturnPercent,
              };
            })
            .filter((p) => p.maxDrawdownPercent > 5)
            .sort((a, b) => b.maxDrawdownPercent - a.maxDrawdownPercent)
            .map((player) => (
              <div
                key={player.name}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-bg-tertiary rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        PLAYER_COLORS[
                          leaderboard.findIndex((e) => e.name === player.name) %
                            PLAYER_COLORS.length
                        ],
                    }}
                  />
                  <span className="font-medium text-text-primary">
                    {player.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Peak: </span>
                    <span className="text-positive tabular-nums">
                      {formatCurrency(player.peak)}
                    </span>
                    <span className="text-text-secondary text-xs ml-1">
                      ({formatPercent(player.peakReturn)})
                    </span>
                  </div>
                  <span className="text-text-secondary">→</span>
                  <div>
                    <span className="text-text-secondary">Now: </span>
                    <span
                      className={`tabular-nums ${
                        player.currentReturn >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {formatCurrency(player.current)}
                    </span>
                  </div>
                  <div className="text-negative tabular-nums">
                    ({formatPercent(-player.maxDrawdownPercent)} max drawdown)
                  </div>
                </div>
              </div>
            ))}
        </div>
        <p className="mt-4 text-xs text-text-secondary">
          Several players saw significant declines from their peak values. koby pfonner
          experienced the most dramatic reversal.
        </p>
      </div>
    </div>
  );
}
