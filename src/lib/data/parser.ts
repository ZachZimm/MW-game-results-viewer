import Papa from "papaparse";
import { promises as fs } from "fs";
import path from "path";
import {
  LeaderboardEntry,
  PerformancePoint,
  Holding,
  Transaction,
  Player,
} from "@/lib/types";
import {
  parseCurrency,
  parsePercent,
  parseDate,
  slugify,
} from "@/lib/utils/format";

const DATA_DIR = path.join(process.cwd(), "data");

async function readCSV<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filePath, "utf-8");
  const result = Papa.parse<T>(content, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data;
}

// Parse Rankings CSV
interface RawRanking {
  Place: string;
  Name: string;
  "Net Worth": string;
  Last: string;
  Trades: string;
  "Total Returns": string;
}

export async function parseLeaderboard(): Promise<LeaderboardEntry[]> {
  const raw = await readCSV<RawRanking>("Rankings - MREtest.csv");
  return raw.map((row) => ({
    place: parseInt(row.Place),
    name: row.Name,
    slug: slugify(row.Name),
    netWorth: parseCurrency(row["Net Worth"]),
    lastChange: parsePercent(row.Last),
    trades: parseInt(row.Trades.replace(/,/g, "")),
    totalReturns: parseCurrency(row["Total Returns"]),
  }));
}

// Parse Portfolio Performance CSV
interface RawPerformance {
  Rank: string;
  Date: string;
  Cash: string;
  "Cash Interest": string;
  "Net Worth": string;
  "% Return": string;
}

export async function parsePerformance(
  playerName: string
): Promise<PerformancePoint[]> {
  const filename = `Portfolio Performance - ${playerName}.csv`;
  const raw = await readCSV<RawPerformance>(filename);

  return raw
    .map((row) => ({
      date: parseDate(row.Date),
      rank: parseInt(row.Rank),
      cash: parseCurrency(row.Cash),
      cashInterest: parseCurrency(row["Cash Interest"]),
      netWorth: parseCurrency(row["Net Worth"]),
      percentReturn: parsePercent(row["% Return"]),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Parse Holdings CSV
interface RawHolding {
  Symbol: string;
  Shares: string;
  "% Holdings": string;
  Type: string;
  Price: string;
  "Price Change": string;
  "Price Change %": string;
  Value: string;
  "Value Gain/Loss": string;
  "Value Gain/Loss %": string;
  "Players Holding": string;
}

export async function parseHoldings(playerName: string): Promise<Holding[]> {
  const filename = `Holdings - ${playerName}.csv`;
  const raw = await readCSV<RawHolding>(filename);

  return raw.map((row) => ({
    symbol: row.Symbol,
    shares: parseInt(row.Shares.replace(/,/g, "")),
    percentOfPortfolio: parseInt(row["% Holdings"].replace(/%/g, "")),
    type: row.Type.toUpperCase() as "BUY" | "SHORT",
    price: parseCurrency(row.Price),
    priceChange: parseFloat(row["Price Change"].replace(/,/g, "")),
    priceChangePercent: parsePercent(row["Price Change %"]),
    value: parseCurrency(row.Value),
    gainLoss: parseCurrency(row["Value Gain/Loss"]),
    gainLossPercent: parsePercent(row["Value Gain/Loss %"]),
  }));
}

// Parse Transactions CSV
interface RawTransaction {
  Symbol: string;
  "Order Date": string;
  "Transaction Date": string;
  Type: string;
  "Cancel Reason": string;
  Amount: string;
  Price: string;
}

export async function parseTransactions(
  playerName: string
): Promise<Transaction[]> {
  const filename = `Portfolio Transactions - ${playerName}.csv`;
  const raw = await readCSV<RawTransaction>(filename);

  return raw
    .filter((row) => row.Symbol) // Skip empty rows
    .map((row) => ({
      symbol: row.Symbol,
      orderDate: parseDate(row["Order Date"]),
      transactionDate: row["Transaction Date"]
        ? parseDate(row["Transaction Date"])
        : null,
      type: row.Type as "Buy" | "Sell" | "Short" | "Cover",
      cancelReason: row["Cancel Reason"] || null,
      amount: parseInt(row.Amount.replace(/,/g, "")),
      price: row.Price && row.Price !== "N/A" ? parseCurrency(row.Price) : null,
    }))
    .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
}

// Get list of all players from Rankings
export async function getPlayers(): Promise<Player[]> {
  const leaderboard = await parseLeaderboard();
  return leaderboard.map((entry) => ({
    name: entry.name,
    slug: entry.slug,
  }));
}

// Get player name from slug
export async function getPlayerBySlug(
  slug: string
): Promise<Player | undefined> {
  const players = await getPlayers();
  return players.find((p) => p.slug === slug);
}
