export interface PlayerStats {
  highScores: Record<string, number>;
  playCounts: Record<string, number>;
  favorites: string[];
  lastAgeGroup: string;
}

const STORAGE_KEY = 'ziyoplay_player_stats_v1';

const DEFAULT_STATS: PlayerStats = {
  highScores: {},
  playCounts: {},
  favorites: [],
  lastAgeGroup: 'all',
};

export function loadPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return {
      highScores: parsed.highScores ?? {},
      playCounts: parsed.playCounts ?? {},
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      lastAgeGroup: parsed.lastAgeGroup ?? 'all',
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function recordHighScore(gameId: string, score: number): PlayerStats {
  const current = loadPlayerStats();
  const prev = current.highScores[gameId] ?? 0;
  const next: PlayerStats = {
    ...current,
    highScores: {
      ...current.highScores,
      [gameId]: Math.max(prev, Math.floor(score)),
    },
  };
  savePlayerStats(next);
  return next;
}

export function incrementPlayCount(gameId: string): PlayerStats {
  const current = loadPlayerStats();
  const next: PlayerStats = {
    ...current,
    playCounts: {
      ...current.playCounts,
      [gameId]: (current.playCounts[gameId] ?? 0) + 1,
    },
  };
  savePlayerStats(next);
  return next;
}

export function toggleFavoriteGame(gameId: string): PlayerStats {
  const current = loadPlayerStats();
  const exists = current.favorites.includes(gameId);
  const favorites = exists
    ? current.favorites.filter((id) => id !== gameId)
    : [...current.favorites, gameId];
  const next: PlayerStats = { ...current, favorites };
  savePlayerStats(next);
  return next;
}
