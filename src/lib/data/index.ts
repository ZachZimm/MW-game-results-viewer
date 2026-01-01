import {
  parseLeaderboard,
  parsePerformance,
  parseHoldings,
  parseTransactions,
  getPlayers,
  getPlayerBySlug,
} from "./parser";
import { calculatePlayerStats, calculateDailyReturns } from "./stats";
import { PlayerData, LeaderboardEntry, PerformancePoint } from "@/lib/types";

// Cache for parsed data
let leaderboardCache: LeaderboardEntry[] | null = null;
const performanceCache: Map<string, PerformancePoint[]> = new Map();
const playerDataCache: Map<string, PlayerData> = new Map();

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!leaderboardCache) {
    leaderboardCache = await parseLeaderboard();
  }
  return leaderboardCache;
}

export async function getPlayerPerformance(
  playerName: string
): Promise<PerformancePoint[]> {
  if (!performanceCache.has(playerName)) {
    const performance = await parsePerformance(playerName);
    performanceCache.set(playerName, performance);
  }
  return performanceCache.get(playerName)!;
}

export async function getPlayerData(playerName: string): Promise<PlayerData> {
  if (!playerDataCache.has(playerName)) {
    const [performance, holdings, transactions, players] = await Promise.all([
      parsePerformance(playerName),
      parseHoldings(playerName),
      parseTransactions(playerName),
      getPlayers(),
    ]);

    const stats = calculatePlayerStats(
      playerName,
      performance,
      transactions,
      holdings.length,
      players.length
    );

    const playerData: PlayerData = {
      player: { name: playerName, slug: stats.slug },
      performance,
      holdings,
      transactions,
      stats,
    };

    playerDataCache.set(playerName, playerData);
  }

  return playerDataCache.get(playerName)!;
}

export async function getAllPlayersPerformance(): Promise<
  Map<string, PerformancePoint[]>
> {
  const players = await getPlayers();
  const performanceMap = new Map<string, PerformancePoint[]>();

  await Promise.all(
    players.map(async (player) => {
      const performance = await getPlayerPerformance(player.name);
      performanceMap.set(player.name, performance);
    })
  );

  return performanceMap;
}

export async function getAllPlayersData(): Promise<PlayerData[]> {
  const players = await getPlayers();
  return Promise.all(players.map((p) => getPlayerData(p.name)));
}

export { getPlayers, getPlayerBySlug, calculateDailyReturns };
