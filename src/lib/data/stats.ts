import {
  PerformancePoint,
  Transaction,
  PlayerStats,
  DailyReturn,
} from "@/lib/types";
import { slugify } from "@/lib/utils/format";

const INITIAL_VALUE = 100000;

export function calculateDailyReturns(
  performance: PerformancePoint[]
): DailyReturn[] {
  const returns: DailyReturn[] = [];

  for (let i = 1; i < performance.length; i++) {
    const prev = performance[i - 1];
    const curr = performance[i];
    const change = curr.netWorth - prev.netWorth;
    const changePercent =
      prev.netWorth > 0 ? (change / prev.netWorth) * 100 : 0;

    returns.push({
      date: curr.date,
      change,
      changePercent,
    });
  }

  return returns;
}

export function calculateVolatility(dailyReturns: DailyReturn[]): number {
  if (dailyReturns.length < 2) return 0;

  const percentReturns = dailyReturns.map((r) => r.changePercent);
  const mean =
    percentReturns.reduce((a, b) => a + b, 0) / percentReturns.length;
  const squaredDiffs = percentReturns.map((r) => Math.pow(r - mean, 2));
  const variance =
    squaredDiffs.reduce((a, b) => a + b, 0) / (squaredDiffs.length - 1);

  return Math.sqrt(variance);
}

export function calculateMaxDrawdown(performance: PerformancePoint[]): {
  maxDrawdown: number;
  maxDrawdownPercent: number;
} {
  let peak = performance[0]?.netWorth || INITIAL_VALUE;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  for (const point of performance) {
    if (point.netWorth > peak) {
      peak = point.netWorth;
    }
    const drawdown = peak - point.netWorth;
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  }

  return { maxDrawdown, maxDrawdownPercent };
}

export function calculateWinRate(dailyReturns: DailyReturn[]): number {
  if (dailyReturns.length === 0) return 0;

  const wins = dailyReturns.filter((r) => r.change > 0).length;
  return (wins / dailyReturns.length) * 100;
}

export function findBestWorstDays(dailyReturns: DailyReturn[]): {
  bestDay: { date: Date; change: number; changePercent: number } | null;
  worstDay: { date: Date; change: number; changePercent: number } | null;
} {
  if (dailyReturns.length === 0) {
    return { bestDay: null, worstDay: null };
  }

  let bestDay = dailyReturns[0];
  let worstDay = dailyReturns[0];

  for (const day of dailyReturns) {
    if (day.change > bestDay.change) {
      bestDay = day;
    }
    if (day.change < worstDay.change) {
      worstDay = day;
    }
  }

  return { bestDay, worstDay };
}

export function findPeak(performance: PerformancePoint[]): {
  peakNetWorth: number;
  peakDate: Date | null;
} {
  if (performance.length === 0) {
    return { peakNetWorth: INITIAL_VALUE, peakDate: null };
  }

  let peak = performance[0];
  for (const point of performance) {
    if (point.netWorth > peak.netWorth) {
      peak = point;
    }
  }

  return { peakNetWorth: peak.netWorth, peakDate: peak.date };
}

export function countDaysAtRankOne(performance: PerformancePoint[]): number {
  return performance.filter((p) => p.rank === 1).length;
}

export function countDaysAtRankLast(
  performance: PerformancePoint[],
  totalPlayers: number
): number {
  return performance.filter((p) => p.rank === totalPlayers).length;
}

export function calculateMedianHoldings(performance: PerformancePoint[]): number {
  // Extract the number of holdings from each performance point
  // Since we don't have holdings count in performance, we'll need to get it from elsewhere
  // For now, return 0 as a placeholder - this will be calculated in the main data loader
  return 0;
}

export function calculatePlayerStats(
  playerName: string,
  performance: PerformancePoint[],
  transactions: Transaction[],
  currentHoldingsCount: number = 0,
  totalPlayers: number = 7
): PlayerStats {
  const dailyReturns = calculateDailyReturns(performance);
  const { maxDrawdown, maxDrawdownPercent } = calculateMaxDrawdown(performance);
  const { bestDay, worstDay } = findBestWorstDays(dailyReturns);
  const { peakNetWorth, peakDate } = findPeak(performance);

  const latestPerformance = performance[performance.length - 1];
  const currentNetWorth = latestPerformance?.netWorth || INITIAL_VALUE;
  const currentRank = latestPerformance?.rank || 0;

  // Count only completed trades (no cancel reason)
  const completedTrades = transactions.filter((t) => !t.cancelReason).length;

  return {
    name: playerName,
    slug: slugify(playerName),
    currentNetWorth,
    totalReturn: currentNetWorth - INITIAL_VALUE,
    totalReturnPercent: ((currentNetWorth - INITIAL_VALUE) / INITIAL_VALUE) * 100,
    bestDay,
    worstDay,
    maxDrawdown,
    maxDrawdownPercent,
    volatility: calculateVolatility(dailyReturns),
    winRate: calculateWinRate(dailyReturns),
    daysAtRankOne: countDaysAtRankOne(performance),
    daysAtRankLast: countDaysAtRankLast(performance, totalPlayers),
    totalTrades: completedTrades,
    currentRank,
    peakNetWorth,
    peakDate,
    medianHoldings: currentHoldingsCount, // Simplified: using current holdings count
  };
}

// Calculate streaks
export function calculateStreaks(dailyReturns: DailyReturn[]): {
  longestWinStreak: number;
  longestLoseStreak: number;
  currentStreak: { type: "win" | "lose" | "none"; count: number };
} {
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;

  for (const day of dailyReturns) {
    if (day.change > 0) {
      currentWinStreak++;
      currentLoseStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else if (day.change < 0) {
      currentLoseStreak++;
      currentWinStreak = 0;
      longestLoseStreak = Math.max(longestLoseStreak, currentLoseStreak);
    }
  }

  const lastDay = dailyReturns[dailyReturns.length - 1];
  let currentStreak: { type: "win" | "lose" | "none"; count: number } = {
    type: "none",
    count: 0,
  };

  if (lastDay) {
    if (currentWinStreak > 0) {
      currentStreak = { type: "win", count: currentWinStreak };
    } else if (currentLoseStreak > 0) {
      currentStreak = { type: "lose", count: currentLoseStreak };
    }
  }

  return { longestWinStreak, longestLoseStreak, currentStreak };
}
