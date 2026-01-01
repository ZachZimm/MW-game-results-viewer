import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayerBySlug, getPlayerData, getLeaderboard, calculateDailyReturns } from "@/lib/data";
import { calculateStreaks } from "@/lib/data/stats";
import { StatCard } from "@/components/cards/StatCard";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { HoldingsTable } from "@/components/tables/HoldingsTable";
import { TransactionsTable } from "@/components/tables/TransactionsTable";
import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatNumber,
} from "@/lib/utils/format";

interface PlayerPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

  const [playerData, leaderboard] = await Promise.all([
    getPlayerData(player.name),
    getLeaderboard(),
  ]);

  const { stats, performance, holdings, transactions } = playerData;
  const dailyReturns = calculateDailyReturns(performance);
  const streaks = calculateStreaks(dailyReturns);

  // Find adjacent players in leaderboard for navigation
  const currentIndex = leaderboard.findIndex((e) => e.slug === slug);
  const prevPlayer = currentIndex > 0 ? leaderboard[currentIndex - 1] : null;
  const nextPlayer =
    currentIndex < leaderboard.length - 1 ? leaderboard[currentIndex + 1] : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">{player.name}</h1>
          <p className="text-text-secondary mt-1">
            Rank #{stats.currentRank} •{" "}
            {stats.totalTrades > 0
              ? `${formatNumber(stats.totalTrades)} trades`
              : "No trades"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {prevPlayer && (
            <Link
              href={`/players/${prevPlayer.slug}`}
              className="px-3 py-2 bg-bg-secondary border border-border-color rounded-lg text-sm hover:bg-bg-tertiary transition-colors"
            >
              ← #{prevPlayer.place} {prevPlayer.name}
            </Link>
          )}
          {nextPlayer && (
            <Link
              href={`/players/${nextPlayer.slug}`}
              className="px-3 py-2 bg-bg-secondary border border-border-color rounded-lg text-sm hover:bg-bg-tertiary transition-colors"
            >
              #{nextPlayer.place} {nextPlayer.name} →
            </Link>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={formatCurrency(stats.currentNetWorth)}
          trend={stats.totalReturn >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Total Return"
          value={formatPercent(stats.totalReturnPercent)}
          subtitle={formatCurrency(stats.totalReturn)}
          trend={stats.totalReturn >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Peak Value"
          value={formatCurrency(stats.peakNetWorth)}
          subtitle={stats.peakDate ? formatDate(stats.peakDate) : undefined}
          trend="up"
        />
        <StatCard
          title="Max Drawdown"
          value={formatPercent(-stats.maxDrawdownPercent)}
          subtitle={formatCurrency(-stats.maxDrawdown)}
          trend="down"
        />
      </div>

      {/* Performance Chart */}
      <div className="bg-bg-secondary rounded-lg border border-border-color p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Performance Over Time
        </h2>
        <PerformanceChart data={performance} height={350} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Section */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Current Holdings
            </h2>
            {holdings.length > 0 ? (
              <HoldingsTable holdings={holdings} />
            ) : (
              <div className="bg-bg-secondary rounded-lg border border-border-color p-8 text-center text-text-secondary">
                No current holdings
              </div>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Allocation Chart */}
          {holdings.length > 0 && (
            <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
                Portfolio Allocation
              </h3>
              <DonutChart holdings={holdings} size={240} />
            </div>
          )}

          {/* Detailed Stats */}
          <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
              Performance Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Win Rate</span>
                <span className="text-sm font-medium tabular-nums">
                  {stats.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Volatility (σ)</span>
                <span className="text-sm font-medium tabular-nums">
                  {stats.volatility.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Days at #1</span>
                <span className="text-sm font-medium tabular-nums">
                  {stats.daysAtRankOne}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Best Day</span>
                <span className="text-sm font-medium tabular-nums text-positive">
                  {stats.bestDay
                    ? formatCurrency(stats.bestDay.change)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Worst Day</span>
                <span className="text-sm font-medium tabular-nums text-negative">
                  {stats.worstDay
                    ? formatCurrency(stats.worstDay.change)
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Streaks */}
          <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
              Streaks
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Longest Win Streak</span>
                <span className="text-sm font-medium tabular-nums text-positive">
                  {streaks.longestWinStreak} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Longest Lose Streak</span>
                <span className="text-sm font-medium tabular-nums text-negative">
                  {streaks.longestLoseStreak} days
                </span>
              </div>
              {streaks.currentStreak.count > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Current Streak</span>
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      streaks.currentStreak.type === "win"
                        ? "text-positive"
                        : "text-negative"
                    }`}
                  >
                    {streaks.currentStreak.count}{" "}
                    {streaks.currentStreak.type === "win" ? "wins" : "losses"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Transaction History
        </h2>
        {transactions.length > 0 ? (
          <TransactionsTable transactions={transactions} />
        ) : (
          <div className="bg-bg-secondary rounded-lg border border-border-color p-8 text-center text-text-secondary">
            No transactions recorded
          </div>
        )}
      </div>
    </div>
  );
}

// Generate static params for all players
export async function generateStaticParams() {
  const leaderboard = await getLeaderboard();
  return leaderboard.map((entry) => ({
    slug: entry.slug,
  }));
}
