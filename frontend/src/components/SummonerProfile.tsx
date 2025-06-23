'use client';

import { Trophy, Target, TrendingUp, Gamepad2, Clock, Star } from 'lucide-react';

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

interface SummonerData {
  level: number;
  profileIconId: number;
  puuid: string;
}

interface PlayerStats {
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

interface Match {
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

interface SummonerProfileProps {
  data: {
    summoner: SummonerData;
    ranked: RankedData[];
    stats: PlayerStats;
    recentMatches: Match[];
    timestamp: string;
  };
}

const QUEUE_TYPES = {
  'RANKED_SOLO_5x5': 'Ranked Solo/Duo',
  'RANKED_FLEX_SR': 'Ranked Flex 5v5',
  'RANKED_FLEX_TT': 'Ranked Flex 3v3'
};

const TIER_COLORS = {
  'IRON': 'from-gray-700 to-gray-600',
  'BRONZE': 'from-orange-700 to-orange-600',
  'SILVER': 'from-gray-400 to-gray-300',
  'GOLD': 'from-yellow-500 to-yellow-400',
  'PLATINUM': 'from-cyan-400 to-cyan-300',
  'EMERALD': 'from-emerald-500 to-emerald-400',
  'DIAMOND': 'from-blue-400 to-blue-300',
  'MASTER': 'from-purple-500 to-purple-400',
  'GRANDMASTER': 'from-red-500 to-red-400',
  'CHALLENGER': 'from-yellow-300 to-yellow-200'
};

const GAME_MODE_NAMES = {
  'ARAM': 'ARAM',
  'CLASSIC': 'Summoner\'s Rift',
  'URF': 'URF',
  'ONEFORALL': 'One for All',
  'NEXUSBLITZ': 'Nexus Blitz'
};

export default function SummonerProfile({ data }: SummonerProfileProps) {
  const { summoner, ranked, stats, recentMatches } = data;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recent';
  };

  const getTierColor = (tier: string) => {
    return TIER_COLORS[tier as keyof typeof TIER_COLORS] || 'from-gray-600 to-gray-500';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {summoner.level}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Summoner Analysis</h2>
            <div className="flex flex-wrap gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Level {summoner.level}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span>Profile Icon: {summoner.profileIconId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranked Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ranked.map((rank, index) => (
          <div key={index} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-xl font-bold text-white">
                  {QUEUE_TYPES[rank.queueType as keyof typeof QUEUE_TYPES] || rank.queueType}
                </h3>
                <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(rank.tier)} text-white font-bold text-sm`}>
                  {rank.tier} {rank.rank}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">LP:</span>
                  <span className="text-white font-medium">{rank.leaguePoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wins:</span>
                  <span className="text-green-400 font-medium">{rank.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Losses:</span>
                  <span className="text-red-400 font-medium">{rank.losses}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-white font-medium">
                    {Math.round((rank.wins / (rank.wins + rank.losses)) * 100)}%
                  </span>
                </div>
                {rank.hotStreak && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-xs font-medium">Hot Streak</span>
                  </div>
                )}
                {rank.veteran && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">Veteran</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Matches */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Gamepad2 className="w-6 h-6 text-purple-400" />
          <h3 className="text-2xl font-bold text-white">Recent Matches</h3>
        </div>
        
        <div className="space-y-4">
          {recentMatches.slice(0, 10).map((match) => (
            <div
              key={match.matchId}
              className={`p-4 rounded-lg border-l-4 ${
                match.player.win 
                  ? 'bg-green-900/20 border-green-400' 
                  : 'bg-red-900/20 border-red-400'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${match.player.win ? 'text-green-400' : 'text-red-400'}`}>
                      {match.player.win ? 'VICTORY' : 'DEFEAT'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {GAME_MODE_NAMES[match.gameMode as keyof typeof GAME_MODE_NAMES] || match.gameMode}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {formatDuration(match.gameDuration)} • {formatTimeAgo(match.gameCreation)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{match.player.championName}</div>
                  <div className="text-sm text-gray-400">Level {summoner.level}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {match.player.kills}/{match.player.deaths}/{match.player.assists}
                  </div>
                  <div className="text-sm text-gray-400">
                    KDA: {match.player.deaths > 0 ? ((match.player.kills + match.player.assists) / match.player.deaths).toFixed(2) : 'Perfect'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-400">Damage</div>
                  <div className="text-white font-medium">
                    {(match.player.totalDamageDealtToChampions / 1000).toFixed(1)}k
                  </div>
                  <div className="text-sm text-gray-400">
                    {match.player.totalMinionsKilled} CS
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      {stats.totalGames > 0 && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">Performance Stats</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
              <div className="text-gray-400">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
              <div className="text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.averageKDA.ratio.toFixed(2)}</div>
              <div className="text-gray-400">Avg KDA</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {stats.averageKDA.kills.toFixed(1)}/{stats.averageKDA.deaths.toFixed(1)}/{stats.averageKDA.assists.toFixed(1)}
              </div>
              <div className="text-gray-400">K/D/A</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
