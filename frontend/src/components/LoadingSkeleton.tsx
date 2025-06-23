import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Score Display Skeleton */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-600/20">
        <div className="text-center">
          <div className="w-24 h-16 bg-gray-600/50 rounded-lg mx-auto mb-2"></div>
          <div className="w-32 h-4 bg-gray-600/50 rounded mx-auto mb-1"></div>
          <div className="w-20 h-3 bg-gray-600/50 rounded mx-auto"></div>
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600/50 rounded"></div>
                <div className="w-20 h-3 bg-gray-600/50 rounded"></div>
              </div>
            </div>
            <div className="w-12 h-8 bg-gray-600/50 rounded mb-2"></div>
            <div className="w-full h-2 bg-gray-700 rounded-full">
              <div className="h-2 bg-gray-600/50 rounded-full w-3/4"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Text Skeleton */}
      <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
        <div className="w-40 h-5 bg-gray-600/50 rounded mb-3"></div>
        <div className="space-y-2">
          <div className="w-full h-4 bg-gray-600/50 rounded"></div>
          <div className="w-5/6 h-4 bg-gray-600/50 rounded"></div>
          <div className="w-4/5 h-4 bg-gray-600/50 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
