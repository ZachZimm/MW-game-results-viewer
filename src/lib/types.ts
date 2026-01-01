// Core data types for the stock market game

export interface Player {
  name: string;
  slug: string;
}

export interface LeaderboardEntry {
  place: number;
  name: string;
  slug: string;
  netWorth: number;
  lastChange: number;
  trades: number;
  totalReturns: number;
}

export interface PerformancePoint {
  date: Date;
  rank: number;
  cash: number;
  cashInterest: number;
  netWorth: number;
  percentReturn: number;
}

export interface Holding {
  symbol: string;
  shares: number;
  percentOfPortfolio: number;
  type: "BUY" | "SHORT";
  price: number;
  priceChange: number;
  priceChangePercent: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface Transaction {
  symbol: string;
  orderDate: Date;
  transactionDate: Date | null;
  type: "Buy" | "Sell" | "Short" | "Cover";
  cancelReason: string | null;
  amount: number;
  price: number | null;
}

export interface PlayerStats {
  name: string;
  slug: string;
  currentNetWorth: number;
  totalReturn: number;
  totalReturnPercent: number;
  bestDay: { date: Date; change: number; changePercent: number } | null;
  worstDay: { date: Date; change: number; changePercent: number } | null;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  volatility: number;
  winRate: number;
  daysAtRankOne: number;
  daysAtRankLast: number;
  totalTrades: number;
  currentRank: number;
  peakNetWorth: number;
  peakDate: Date | null;
  medianHoldings: number;
}

export interface PlayerData {
  player: Player;
  performance: PerformancePoint[];
  holdings: Holding[];
  transactions: Transaction[];
  stats: PlayerStats;
}

export interface DailyReturn {
  date: Date;
  change: number;
  changePercent: number;
}
