"use client";

import Link from "next/link";
import { LeaderboardEntry, PerformancePoint } from "@/lib/types";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils/format";
import { Sparkline } from "@/components/charts/Sparkline";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  performanceData?: Map<string, PerformancePoint[]>;
}

export function LeaderboardTable({
  entries,
  performanceData,
}: LeaderboardTableProps) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border-color overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-color">
              <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Rank
              </th>
              <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Player
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Net Worth
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Total Return
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Trades
              </th>
              {performanceData && (
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 w-32">
                  90-Day Trend
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {entries.map((entry) => {
              const returnColor =
                entry.totalReturns >= 0 ? "text-positive" : "text-negative";

              // Get last 90 days of performance for sparkline
              const playerPerf = performanceData?.get(entry.name);
              const sparklineData = playerPerf
                ?.slice(-90)
                .map((p) => p.netWorth);

              return (
                <tr
                  key={entry.slug}
                  className="hover:bg-bg-tertiary transition-colors"
                >
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bg-tertiary text-sm font-medium">
                      {entry.place}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/players/${entry.slug}`}
                      className="font-medium text-text-primary hover:text-accent transition-colors"
                    >
                      {entry.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums font-medium">
                    {formatCurrency(entry.netWorth)}
                  </td>
                  <td className={`px-4 py-4 text-right tabular-nums ${returnColor}`}>
                    {formatCurrency(entry.totalReturns)}
                    <span className="text-text-secondary text-sm ml-1">
                      ({formatPercent((entry.totalReturns / 100000) * 100)})
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-text-secondary">
                    {formatNumber(entry.trades)}
                  </td>
                  {performanceData && (
                    <td className="px-4 py-4">
                      {sparklineData && sparklineData.length > 0 && (
                        <Sparkline
                          data={sparklineData}
                          width={100}
                          height={32}
                          color={
                            entry.totalReturns >= 0 ? "#22c55e" : "#ef4444"
                          }
                        />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
