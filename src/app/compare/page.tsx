import {
  getLeaderboard,
  getAllPlayersPerformance,
  getAllPlayersData,
} from "@/lib/data";
import { BumpChart } from "@/components/charts/BumpChart";
import { ScatterPlot } from "@/components/charts/ScatterPlot";
import { CapitalUseChart } from "@/components/charts/CapitalUseChart";
import { PLAYER_COLORS } from "@/lib/constants";
import { formatPercent, formatNumber } from "@/lib/utils/format";

export default async function ComparePage() {
  const [leaderboard, performanceMap, allPlayersData] = await Promise.all([
    getLeaderboard(),
    getAllPlayersPerformance(),
    getAllPlayersData(),
  ]);

  // Prepare data for charts
  const chartData = leaderboard.map((entry, index) => ({
    name: entry.name,
    data: performanceMap.get(entry.name) || [],
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
  }));

  // Scatter plot data (risk vs return)
  const scatterData = allPlayersData.map((player, index) => ({
    name: player.player.name,
    x: player.stats.volatility,
    y: player.stats.totalReturnPercent,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
  }));

  // Strategy comparison data
  const strategyData = allPlayersData
    .sort((a, b) => b.stats.totalReturnPercent - a.stats.totalReturnPercent)
    .map((player) => ({
      ...player,
      color: PLAYER_COLORS[leaderboard.findIndex((e) => e.name === player.player.name) % PLAYER_COLORS.length],
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Compare Players</h1>
        <p className="text-text-secondary mt-1">
          Side-by-side analysis of all participants
        </p>
      </div>

      {/* Rank Changes (Bump Chart) */}
      <div className="bg-bg-secondary rounded-lg border border-border-color p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Rank Changes Over Time
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          See how positions shifted throughout the competition
        </p>
        <BumpChart playersData={chartData} height={350} />
      </div>

      {/* Risk vs Return */}
      <div className="bg-bg-secondary rounded-lg border border-border-color p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Risk vs Return
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Higher returns don&apos;t always mean higher risk — find the efficient players
        </p>
        <ScatterPlot data={scatterData} height={400} />
      </div>

      {/* Capital Use Comparison */}
      <div className="bg-bg-secondary rounded-lg border border-border-color p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Capital Use Comparison
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          How much capital each player has allocated over time (0% = all cash, 50% = all capital invested, 100% = fully invested with margin)
        </p>
        <CapitalUseChart playersData={chartData} height={400} />
      </div>

      {/* Strategy Comparison Table */}
      <div className="bg-bg-secondary rounded-lg border border-border-color overflow-hidden">
        <div className="px-6 py-4 border-b border-border-color">
          <h2 className="text-lg font-semibold text-text-primary">
            Strategy Comparison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Player
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Return
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Volatility
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Sharpe
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Max Drawdown
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Win Rate
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Trades
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Days #1
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Days in Last
                </th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-3">
                  Median Holdings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {strategyData.map((player) => {
                const sharpeLike =
                  player.stats.volatility > 0
                    ? player.stats.totalReturnPercent / player.stats.volatility
                    : 0;

                return (
                  <tr
                    key={player.player.slug}
                    className="hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="font-medium text-text-primary">
                          {player.player.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-right tabular-nums font-medium ${
                        player.stats.totalReturnPercent >= 0
                          ? "text-positive"
                          : "text-negative"
                      }`}
                    >
                      {formatPercent(player.stats.totalReturnPercent)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-text-secondary">
                      {player.stats.volatility.toFixed(2)}%
                    </td>
                    <td
                      className={`px-6 py-4 text-right tabular-nums ${
                        sharpeLike >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {sharpeLike.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-negative">
                      {formatPercent(-player.stats.maxDrawdownPercent)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-text-secondary">
                      {player.stats.winRate.toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-text-secondary">
                      {formatNumber(player.stats.totalTrades)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-text-secondary">
                      {player.stats.daysAtRankOne}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-text-secondary">
                      {player.stats.daysAtRankLast}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-text-secondary">
                      {player.stats.medianHoldings}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
            Active vs Passive
          </h3>
          <div className="space-y-4">
            {strategyData
              .sort((a, b) => b.stats.totalTrades - a.stats.totalTrades)
              .map((player) => (
                <div key={player.player.slug} className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-sm text-text-primary flex-1">
                    {player.player.name}
                  </span>
                  <span className="text-sm text-text-secondary tabular-nums">
                    {formatNumber(player.stats.totalTrades)} trades
                  </span>
                  <span
                    className={`text-sm tabular-nums ${
                      player.stats.totalReturnPercent >= 0
                        ? "text-positive"
                        : "text-negative"
                    }`}
                  >
                    {formatPercent(player.stats.totalReturnPercent)}
                  </span>
                </div>
              ))}
          </div>
          <p className="mt-4 text-xs text-text-secondary">
            More trades don&apos;t guarantee better returns. Matthew&apos;s 6 trades outperform
            many active traders.
          </p>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
            Concentration Risk
          </h3>
          <div className="space-y-4">
            {allPlayersData
              .sort(
                (a, b) =>
                  Math.max(...b.holdings.map((h) => h.percentOfPortfolio), 0) -
                  Math.max(...a.holdings.map((h) => h.percentOfPortfolio), 0)
              )
              .map((player) => {
                const topHolding = player.holdings.sort(
                  (a, b) => b.percentOfPortfolio - a.percentOfPortfolio
                )[0];
                const concentration = topHolding?.percentOfPortfolio || 0;
                const color = PLAYER_COLORS[leaderboard.findIndex((e) => e.name === player.player.name) % PLAYER_COLORS.length];

                return (
                  <div key={player.player.slug} className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-text-primary flex-1">
                      {player.player.name}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {topHolding?.symbol || "—"}
                    </span>
                    <div className="w-16 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${concentration}%`,
                          backgroundColor:
                            concentration > 50 ? "#ef4444" : "#22c55e",
                        }}
                      />
                    </div>
                    <span className="text-sm text-text-secondary tabular-nums w-10 text-right">
                      {concentration}%
                    </span>
                  </div>
                );
              })}
          </div>
          <p className="mt-4 text-xs text-text-secondary">
            High concentration (Cooper: 85% DJT) led to massive losses when positions went
            against them.
          </p>
        </div>
      </div>
    </div>
  );
}
