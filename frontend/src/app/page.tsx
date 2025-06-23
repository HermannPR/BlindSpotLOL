'use client';

import { useState } from 'react';
import SummonerSearch from '@/components/SummonerSearch';
import SummonerProfile from '@/components/SummonerProfile';
import AIAnalysis from '@/components/AIAnalysis';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useSummonerAPI } from '@/hooks/useSummonerAPI';

interface SearchParams {
  region: string;
  summonerName: string;
}

export default function Home() {
  const { loading, error, data: summonerData, fetchSummoner } = useSummonerAPI();
  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null);

  const handleSearch = async (region: string, summonerName: string) => {
    try {
      setLastSearch({ region, summonerName });
      await fetchSummoner(region, summonerName);
    } catch (err) {
      // Error is already handled by the hook
      console.error('Search failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Search Component */}
          <SummonerSearch onSearch={handleSearch} loading={loading} />

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="bg-gray-800/50 rounded-lg p-8 flex items-center gap-4">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <div className="text-white">
                  <h3 className="font-semibold">Analyzing Summoner...</h3>
                  <p className="text-sm text-gray-300">Fetching data from Riot API</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <h3 className="font-semibold text-red-400">Error</h3>
                </div>
                <p className="text-red-200 text-sm">{error}</p>
                <div className="mt-4 text-xs text-red-300">
                  <p>• Make sure the summoner name is correct</p>
                  <p>• Verify the region is accurate</p>
                  <p>• Use RiotID format: GameName#TAG</p>
                </div>
              </div>
            </div>
          )}

          {/* Summoner Profile */}
          {summonerData && !loading && lastSearch && (
            <>
              <SummonerProfile data={summonerData} />
              <AIAnalysis 
                region={lastSearch.region} 
                summonerName={lastSearch.summonerName} 
                puuid={summonerData.summoner.puuid} 
              />
            </>
          )}

          {/* Welcome State */}
          {!summonerData && !loading && !error && (
            <div className="text-center py-12">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-8 max-w-2xl mx-auto border border-gray-700">
                <h2 className="text-3xl font-bold text-white mb-4">
                  🚀 Welcome to BlindSpot LOL
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Get detailed analysis of any League of Legends summoner with AI-powered insights, 
                  match history, and performance statistics.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-purple-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-300 mb-2">📊 Ranked Analysis</h3>
                    <p className="text-gray-400">View current rank, LP, win rates, and climb progress</p>
                  </div>
                  <div className="bg-blue-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-300 mb-2">🎮 Match History</h3>
                    <p className="text-gray-400">Detailed breakdown of recent games and performance</p>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-green-300 mb-2">🧠 AI Insights</h3>
                    <p className="text-gray-400">AI-powered performance analysis and coaching recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
