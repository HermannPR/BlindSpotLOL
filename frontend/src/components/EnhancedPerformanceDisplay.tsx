import React from 'react';
import { TrendingUp, TrendingDown, Target, Trophy, Zap, Shield } from 'lucide-react';

interface PerformanceMetricProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

const PerformanceMetric: React.FC<PerformanceMetricProps> = ({
  label,
  value,
  maxValue,
  color,
  icon,
  trend,
  description
}) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`text-${color}-400`}>{icon}</div>
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 
            'text-gray-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div className="flex items-end gap-1">
          <span className={`text-2xl font-bold text-${color}-400`}>
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">/ {maxValue}</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div 
          className={`h-2 bg-gradient-to-r from-${color}-500 to-${color}-400 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {description && (
        <p className="text-xs text-gray-400 mt-2">{description}</p>
      )}
    </div>
  );
};

interface EnhancedPerformanceDisplayProps {
  score: number;
  analysis: string;
}

const EnhancedPerformanceDisplay: React.FC<EnhancedPerformanceDisplayProps> = ({
  score,
  analysis
}) => {
  // Extract metrics from analysis text (you can make this more sophisticated)
  const extractMetric = (text: string, pattern: RegExp, defaultValue: number = 0): number => {
    const match = text.match(pattern);
    return match ? parseFloat(match[1]) : defaultValue;
  };

  const kdaScore = extractMetric(analysis, /KDA.*?(\d+\.?\d*)/i, 7.0);
  const csScore = extractMetric(analysis, /CS.*?(\d+\.?\d*)/i, 6.5);
  const damageScore = extractMetric(analysis, /Damage.*?(\d+\.?\d*)/i, 7.5);
  const visionScore = score * 0.8; // Derive from overall score
  const consistencyScore = extractMetric(analysis, /Consistency.*?(\d+\.?\d*)/i, score * 0.9);

  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/20">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {score.toFixed(1)}
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-xl"></div>
          </div>
          <div className="text-gray-400 text-sm mt-2">Overall Performance Score</div>
          <div className={`text-sm font-medium mt-1 ${
            score >= 8 ? 'text-green-400' : 
            score >= 6 ? 'text-yellow-400' : 
            score >= 4 ? 'text-orange-400' : 'text-red-400'
          }`}>
            {score >= 8 ? 'Excellent' : 
             score >= 6 ? 'Good' : 
             score >= 4 ? 'Average' : 'Needs Improvement'}
          </div>
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PerformanceMetric
          label="KDA Performance"
          value={kdaScore}
          maxValue={10}
          color="green"
          icon={<Trophy className="w-4 h-4" />}
          trend={kdaScore > 7 ? 'up' : kdaScore < 5 ? 'down' : 'neutral'}
          description="Kill/Death/Assist ratio performance"
        />
        
        <PerformanceMetric
          label="CS & Farming"
          value={csScore}
          maxValue={10}
          color="yellow"
          icon={<Target className="w-4 h-4" />}
          trend={csScore > 6.5 ? 'up' : csScore < 5.5 ? 'down' : 'neutral'}
          description="Creep score and gold generation"
        />
        
        <PerformanceMetric
          label="Damage Output"
          value={damageScore}
          maxValue={10}
          color="red"
          icon={<Zap className="w-4 h-4" />}
          trend={damageScore > 7 ? 'up' : damageScore < 6 ? 'down' : 'neutral'}
          description="Team fight contribution and damage dealt"
        />
        
        <PerformanceMetric
          label="Vision Control"
          value={visionScore}
          maxValue={10}
          color="blue"
          icon={<Shield className="w-4 h-4" />}
          trend={visionScore > 6 ? 'up' : visionScore < 4 ? 'down' : 'neutral'}
          description="Ward placement and map awareness"
        />
        
        <PerformanceMetric
          label="Consistency"
          value={consistencyScore}
          maxValue={10}
          color="purple"
          icon={<TrendingUp className="w-4 h-4" />}
          trend={consistencyScore > 7 ? 'up' : consistencyScore < 5 ? 'down' : 'neutral'}
          description="Performance stability across games"
        />
        
        <PerformanceMetric
          label="Overall Rating"
          value={score}
          maxValue={10}
          color="indigo"
          icon={<Trophy className="w-4 h-4" />}
          description="Combined performance assessment"
        />
      </div>

      {/* Performance Insights */}
      <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Performance Insights
        </h4>
        <div className="text-gray-300 leading-relaxed">
          {score >= 8 && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-3">
              <p className="text-green-300 font-medium">🌟 Outstanding Performance!</p>
              <p className="text-green-200 text-sm mt-1">
                You&apos;re performing exceptionally well. Focus on maintaining this level and refining advanced strategies.
              </p>
            </div>
          )}
          
          {score >= 6 && score < 8 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-3">
              <p className="text-yellow-300 font-medium">⚡ Solid Performance</p>
              <p className="text-yellow-200 text-sm mt-1">
                Good fundamentals with room for growth. Focus on consistency and key areas for improvement.
              </p>
            </div>
          )}
          
          {score < 6 && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-3">
              <p className="text-orange-300 font-medium">🎯 Growth Opportunity</p>
              <p className="text-orange-200 text-sm mt-1">
                Clear areas for improvement identified. Focus on fundamentals and consistent practice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPerformanceDisplay;
