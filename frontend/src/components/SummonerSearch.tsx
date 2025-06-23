'use client';

import { useState } from 'react';
import { Search, Users, Globe } from 'lucide-react';

interface SummonerSearchProps {
  onSearch: (region: string, summonerName: string) => void;
  loading?: boolean;
}

const REGIONS = [
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

export default function SummonerSearch({ onSearch, loading = false }: SummonerSearchProps) {
  const [region, setRegion] = useState('la1'); // Default to LAN for GraveMan
  const [summonerName, setSummonerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (summonerName.trim()) {
      onSearch(region, summonerName.trim());
    }
  };

  const handleExampleSearch = () => {
    setSummonerName('GraveMan#CLN');
    setRegion('la1');
    onSearch('la1', 'GraveMan#CLN');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-xl p-8 shadow-2xl border border-purple-500/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Users className="w-10 h-10 text-purple-400" />
            BlindSpot LOL
          </h1>
          <p className="text-purple-200 text-lg">
            Analyze your League of Legends performance with AI-powered insights
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Region Selection */}
            <div className="space-y-2">
              <label htmlFor="region" className="block text-sm font-medium text-purple-200">
                <Globe className="w-4 h-4 inline mr-2" />
                Region
              </label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name} ({r.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Summoner Name Input */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="summoner" className="block text-sm font-medium text-purple-200">
                <Search className="w-4 h-4 inline mr-2" />
                Summoner Name (RiotID format: Name#TAG)
              </label>
              <div className="relative">
                <input
                  id="summoner"
                  type="text"
                  value={summonerName}
                  onChange={(e) => setSummonerName(e.target.value)}
                  placeholder="Enter summoner name (e.g., GraveMan#CLN)"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                  disabled={loading}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              type="submit"
              disabled={loading || !summonerName.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze Summoner
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExampleSearch}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-gray-700 text-purple-200 font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Try Example: GraveMan#CLN
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-purple-300 mb-2">💡 Tips:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Use RiotID format: <span className="text-purple-400 font-mono">GameName#TAG</span></li>
            <li>• Example: <span className="text-blue-400 font-mono">GraveMan#CLN</span> for LAN region</li>
            <li>• Make sure to select the correct region for accurate results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
