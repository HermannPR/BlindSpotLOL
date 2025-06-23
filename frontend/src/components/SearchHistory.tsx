import React, { useState, useEffect } from 'react';
import { Clock, X, Star } from 'lucide-react';

interface SearchHistoryItem {
  id: string;
  region: string;
  summonerName: string;
  timestamp: number;
  isFavorite?: boolean;
}

interface SearchHistoryProps {
  onSearchSelect: (region: string, summonerName: string) => void;
  currentSearch?: { region: string; summonerName: string };
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ onSearchSelect, currentSearch }) => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    // Load from localStorage
    const savedHistory = localStorage.getItem('lol-search-history');
    const savedFavorites = localStorage.getItem('lol-favorites');
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    // Save new search to history
    if (currentSearch) {
      const newItem: SearchHistoryItem = {
        id: `${currentSearch.region}-${currentSearch.summonerName}-${Date.now()}`,
        region: currentSearch.region,
        summonerName: currentSearch.summonerName,
        timestamp: Date.now()
      };

      setHistory(prev => {
        // Remove duplicates and limit to 10 items
        const filtered = prev.filter(item => 
          !(item.region === currentSearch.region && item.summonerName === currentSearch.summonerName)
        );
        const updated = [newItem, ...filtered].slice(0, 10);
        localStorage.setItem('lol-search-history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentSearch]);

  const toggleFavorite = (item: SearchHistoryItem) => {
    const isFavorited = favorites.some(fav => 
      fav.region === item.region && fav.summonerName === item.summonerName
    );

    if (isFavorited) {
      const updated = favorites.filter(fav => 
        !(fav.region === item.region && fav.summonerName === item.summonerName)
      );
      setFavorites(updated);
      localStorage.setItem('lol-favorites', JSON.stringify(updated));
    } else {
      const updated = [...favorites, { ...item, isFavorite: true }];
      setFavorites(updated);
      localStorage.setItem('lol-favorites', JSON.stringify(updated));
    }
  };

  const removeFromHistory = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('lol-search-history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('lol-search-history');
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (history.length === 0 && favorites.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Favorites
          </h3>
          <div className="space-y-2">
            {favorites.map((item) => (
              <div
                key={`fav-${item.region}-${item.summonerName}`}
                className="flex items-center justify-between p-2 bg-yellow-900/20 border border-yellow-500/30 rounded cursor-pointer hover:bg-yellow-900/30 transition-colors"
                onClick={() => onSearchSelect(item.region, item.summonerName)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded uppercase font-medium">
                    {item.region}
                  </span>
                  <span className="text-sm text-white font-medium">{item.summonerName}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item);
                  }}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Recent Searches
            </h3>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => {
              const isFavorited = favorites.some(fav => 
                fav.region === item.region && fav.summonerName === item.summonerName
              );
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700/70 transition-colors"
                  onClick={() => onSearchSelect(item.region, item.summonerName)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded uppercase font-medium">
                      {item.region}
                    </span>
                    <span className="text-sm text-white">{item.summonerName}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                      }}
                      className={`${
                        isFavorited ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                      } transition-colors`}
                    >
                      <Star className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.id);
                      }}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchHistory;
