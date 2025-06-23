import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/constants';

interface SummonerData {
  summoner: {
    level: number;
    profileIconId: number;
    puuid: string;
  };
  ranked: RankedData[];
  stats: StatsData;
  recentMatches: MatchData[];
  timestamp: string;
}

interface RankedData {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

interface StatsData {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKDA: {
    kills: number;
    deaths: number;
    assists: number;
    ratio: number;
  };
}

interface MatchData {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  player: {
    championName: string;
    championId: number;
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
    totalDamageDealtToChampions: number;
    visionScore: number;
    goldEarned: number;
    totalMinionsKilled: number;
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
  };
}

export const useSummonerAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummonerData | null>(null);

  const fetchSummoner = useCallback(async (region: string, summonerName: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/summoner/${region}/${encodeURIComponent(summonerName)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      return result;    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch summoner data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    fetchSummoner,
    clearError,
    reset
  };
};
