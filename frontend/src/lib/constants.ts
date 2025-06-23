export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const REGIONS = [
  { code: 'na1', name: 'North America', cluster: 'americas' },
  { code: 'euw1', name: 'Europe West', cluster: 'europe' },
  { code: 'eun1', name: 'Europe Nordic & East', cluster: 'europe' },
  { code: 'kr', name: 'Korea', cluster: 'asia' },
  { code: 'br1', name: 'Brazil', cluster: 'americas' },
  { code: 'la1', name: 'Latin America North', cluster: 'americas' },
  { code: 'la2', name: 'Latin America South', cluster: 'americas' },
  { code: 'oc1', name: 'Oceania', cluster: 'americas' },
  { code: 'tr1', name: 'Turkey', cluster: 'europe' },
  { code: 'ru', name: 'Russia', cluster: 'europe' },
  { code: 'jp1', name: 'Japan', cluster: 'asia' },
];

export const QUEUE_TYPES = {
  'RANKED_SOLO_5x5': 'Ranked Solo/Duo',
  'RANKED_FLEX_SR': 'Ranked Flex 5v5',
  'RANKED_FLEX_TT': 'Ranked Flex 3v3'
};

export const TIER_COLORS = {
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

export const GAME_MODE_NAMES = {
  'ARAM': 'ARAM',
  'CLASSIC': 'Summoner\'s Rift',
  'URF': 'URF',
  'ONEFORALL': 'One for All',
  'NEXUSBLITZ': 'Nexus Blitz'
};

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Recent';
};

export const getTierColor = (tier: string) => {
  return TIER_COLORS[tier as keyof typeof TIER_COLORS] || 'from-gray-600 to-gray-500';
};

export const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

export const calculateKDA = (kills: number, deaths: number, assists: number) => {
  if (deaths === 0) return 'Perfect';
  return ((kills + assists) / deaths).toFixed(2);
};
