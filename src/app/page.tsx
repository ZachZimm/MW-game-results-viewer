import { getLeaderboard, getAllPlayersPerformance, getAllPlayersData } from "@/lib/data";
import { StatCard } from "@/components/cards/StatCard";
import { LeaderboardTable } from "@/components/tables/LeaderboardTable";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { PLAYER_COLORS } from "@/lib/constants";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/format";

export default async function DashboardPage() {
  const [leaderboard, performanceMap, allPlayersData] = await Promise.all([
    getLeaderboard(),
    getAllPlayersPerformance(),
    getAllPlayersData(),
  ]);

  // Enhance leaderboard with calculated stats (for consistency)
  const enhancedLeaderboard = leaderboard.map((entry) => {
    const playerData = allPlayersData.find((p) => p.player.name === entry.name);
    if (playerData) {
      return {
        ...entry,
        totalReturns: playerData.stats.totalReturn, // Use calculated value
        netWorth: playerData.stats.currentNetWorth, // Use calculated value
      };
    }
    return entry;
  });

  // Calculate summary statistics
  const mostActiveTrader = enhancedLeaderboard.reduce((prev, curr) =>
    curr.trades > prev.trades ? curr : prev
  );
  
  // Find player with highest peak return
  const playerWithHighestPeak = allPlayersData.reduce((prev, curr) =>
    curr.stats.peakNetWorth > prev.stats.peakNetWorth ? curr : prev
  );

  // Find player with lowest trough (lowest net worth ever reached)
  const playerWithLowestTrough = allPlayersData.reduce((prev, curr) => {
    const prevMin = Math.min(...prev.performance.map(p => p.netWorth));
    const currMin = Math.min(...curr.performance.map(p => p.netWorth));
    return currMin < prevMin ? curr : prev;
  });
  const lowestTrough = Math.min(...playerWithLowestTrough.performance.map(p => p.netWorth));

  // Find most volatile player (highest standard deviation)
  const mostVolatile = allPlayersData.reduce((prev, curr) =>
    curr.stats.volatility > prev.stats.volatility ? curr : prev
  );

  // Prepare data for chart
  const chartData = enhancedLeaderboard.map((entry, index) => ({
    name: entry.name,
    data: performanceMap.get(entry.name) || [],
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">The West Is The Best 2025 Market Game</h1>
        <p className="text-lg font-semibold text-text-primary mt-1">
          MRE Stock Competition • Started May 2025
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Highest Peak"
          value={formatPercent(((playerWithHighestPeak.stats.peakNetWorth - 100000) / 100000) * 100)}
          subtitle={playerWithHighestPeak.player.name}
          trend="up"
        />
        <StatCard
          title="Lowest Trough"
          value={formatPercent(((lowestTrough - 100000) / 100000) * 100)}
          subtitle={playerWithLowestTrough.player.name}
          trend="down"
        />
        <StatCard
          title="Most Active Trader"
          value={formatNumber(mostActiveTrader.trades)}
          subtitle={mostActiveTrader.name}
        />
        <StatCard
          title="Most Volatile"
          value={formatPercent(mostVolatile.stats.volatility, 1)}
          subtitle={mostVolatile.player.name + " daily σ"}
        />
      </div>

      {/* Net Worth Chart */}
      <div className="bg-bg-secondary rounded-lg border border-border-color p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Net Worth Over Time
        </h2>
        <NetWorthChart playersData={chartData} height={400} />
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Leaderboard
        </h2>
        <LeaderboardTable entries={enhancedLeaderboard} performanceData={performanceMap} />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Win Rates */}
        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
            Win Rates (Positive Days)
          </h3>
          <div className="space-y-3">
            {allPlayersData
              .sort((a, b) => b.stats.winRate - a.stats.winRate)
              .map((player) => (
                <div key={player.player.slug} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{player.player.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-positive rounded-full"
                        style={{ width: `${player.stats.winRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-text-secondary tabular-nums w-12 text-right">
                      {player.stats.winRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Days at #1 */}
        <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
            Days at #1
          </h3>
          <div className="space-y-3">
            {allPlayersData
              .filter((p) => p.stats.daysAtRankOne > 0)
              .sort((a, b) => b.stats.daysAtRankOne - a.stats.daysAtRankOne)
              .map((player) => (
                <div key={player.player.slug} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{player.player.name}</span>
                  <span className="text-sm text-text-secondary tabular-nums">
                    {player.stats.daysAtRankOne} days
                  </span>
                </div>
              ))}
            {allPlayersData.filter((p) => p.stats.daysAtRankOne > 0).length === 0 && (
              <p className="text-sm text-text-secondary">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
