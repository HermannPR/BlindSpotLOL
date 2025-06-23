'use client';

import { useState } from 'react';
import { Brain, Lightbulb, TrendingUp, Target, Loader2, AlertCircle } from 'lucide-react';

interface AIAnalysisProps {
  region: string;
  summonerName: string;
  puuid: string;
}

interface AIAnalysisData {
  analysis: string;
  insights: string[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  score: number;
  timestamp: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AIAnalysis({ region, summonerName, puuid }: AIAnalysisProps) {
  // ✅ FIXED: Separate states for each analysis type
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [championsLoading, setChampionsLoading] = useState(false);
  
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [coachingError, setCoachingError] = useState<string | null>(null);
  const [championsError, setChampionsError] = useState<string | null>(null);
  
  const [performanceData, setPerformanceData] = useState<AIAnalysisData | null>(null);
  const [coachingData, setCoachingData] = useState<AIAnalysisData | null>(null);
  const [championsData, setChampionsData] = useState<AIAnalysisData | null>(null);

  const generateAnalysis = async (type: 'performance' | 'coaching' | 'champions') => {
    // Set loading state for specific type
    if (type === 'performance') {
      setPerformanceLoading(true);
      setPerformanceError(null);
    } else if (type === 'coaching') {
      setCoachingLoading(true);
      setCoachingError(null);
    } else {
      setChampionsLoading(true);
      setChampionsError(null);
    }

    try {
      const endpoint = type === 'performance' 
        ? `/api/ai/analyze/${region}/${encodeURIComponent(summonerName)}`
        : type === 'coaching'
        ? `/api/ai/coaching/${region}/${encodeURIComponent(summonerName)}`
        : `/api/ai/champions/${region}/${encodeURIComponent(summonerName)}`;      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisType: type })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const aiData = result.analysis || result.coaching || result.recommendations;
        
        // Set data to appropriate state based on type
        if (type === 'performance') {
          setPerformanceData(aiData);
        } else if (type === 'coaching') {
          setCoachingData(aiData);
        } else {
          setChampionsData(aiData);
        }
      } else {
        throw new Error(result.error || 'Analysis failed');
      }    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI analysis';
      
      // Set error to appropriate state based on type
      if (type === 'performance') {
        setPerformanceError(errorMessage);
      } else if (type === 'coaching') {
        setCoachingError(errorMessage);
      } else {
        setChampionsError(errorMessage);
      }
      
      console.error('AI Analysis error:', err);
    } finally {
      // Set loading to false for appropriate type
      if (type === 'performance') {
        setPerformanceLoading(false);
      } else if (type === 'coaching') {
        setCoachingLoading(false);
      } else {
        setChampionsLoading(false);
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header with Analysis Type Selection */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-purple-400" />
          <h2 className="text-3xl font-bold text-white">AI Performance Analysis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => generateAnalysis('performance')}
            disabled={performanceLoading}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              performanceData
                ? 'border-purple-500 bg-purple-900/30'
                : 'border-gray-600 bg-gray-800/30 hover:border-purple-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-3">
              {performanceLoading ? (
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              ) : (
                <TrendingUp className="w-6 h-6 text-purple-400" />
              )}
              <div className="text-left">
                <h3 className="text-white font-semibold">Performance Analysis</h3>
                <p className="text-gray-400 text-sm">
                  {performanceLoading ? 'Analyzing...' : 'Overall gameplay assessment'}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => generateAnalysis('coaching')}
            disabled={coachingLoading}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              coachingData
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-600 bg-gray-800/30 hover:border-blue-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-3">
              {coachingLoading ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              ) : (
                <Lightbulb className="w-6 h-6 text-blue-400" />
              )}
              <div className="text-left">
                <h3 className="text-white font-semibold">Coaching Insights</h3>
                <p className="text-gray-400 text-sm">
                  {coachingLoading ? 'Generating insights...' : 'Personalized improvement tips'}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => generateAnalysis('champions')}
            disabled={championsLoading}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              championsData
                ? 'border-green-500 bg-green-900/30'
                : 'border-gray-600 bg-gray-800/30 hover:border-green-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-3">
              {championsLoading ? (
                <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
              ) : (
                <Target className="w-6 h-6 text-green-400" />
              )}
              <div className="text-left">
                <h3 className="text-white font-semibold">Champion Recommendations</h3>
                <p className="text-gray-400 text-sm">
                  {championsLoading ? 'Finding champions...' : 'Best champions for your style'}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Demo Notice */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="text-yellow-400 font-semibold">AI Analysis Demo</h4>
              <p className="text-yellow-200 text-sm">
                Click any button above to generate AI-powered insights. Each analysis is independent and will appear in its own section below.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analysis Results */}
      {performanceData && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-purple-500/30">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <h3 className="text-2xl font-bold text-white">Performance Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-purple-900/30 rounded-lg p-6 text-center">
                <div className="mb-2">
                  <div className={`text-6xl font-bold ${getScoreColor(performanceData.score)}`}>
                    {performanceData.score.toFixed(1)}
                  </div>
                  <div className="text-gray-400 text-sm">Performance Score</div>
                  <div className={`text-sm ${getScoreColor(performanceData.score)}`}>
                    {getScoreLabel(performanceData.score)}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Analysis Overview
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  {performanceData.analysis}
                </p>
              </div>

              {performanceData.strengths && performanceData.strengths.length > 0 && (
                <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                  <h4 className="text-lg font-semibold text-green-400 mb-4">🟢 Strengths</h4>
                  <ul className="space-y-2">
                    {performanceData.strengths.map((strength: string, index: number) => (
                      <li key={index} className="text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {performanceData.weaknesses && performanceData.weaknesses.length > 0 && (
                <div className="bg-red-900/20 rounded-lg p-6 border border-red-500/30">
                  <h4 className="text-lg font-semibold text-red-400 mb-4">🔴 Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {performanceData.weaknesses.map((weakness: string, index: number) => (
                      <li key={index} className="text-gray-300 flex items-start gap-2">
                        <span className="text-red-400 mt-1">⚠</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance Analysis Error */}
      {performanceError && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="font-semibold text-red-400">Performance Analysis Failed</h3>
          </div>
          <p className="text-red-200">{performanceError}</p>
        </div>
      )}

      {/* Coaching Analysis Results */}
      {coachingData && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-blue-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-8 h-8 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">Coaching Insights</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                Coaching Analysis
              </h4>
              <p className="text-gray-300 leading-relaxed">
                {coachingData.analysis}
              </p>
            </div>

            {coachingData.insights && coachingData.insights.length > 0 && (
              <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-500/30">
                <h4 className="text-lg font-semibold text-blue-400 mb-4">💡 Key Insights</h4>
                <ul className="space-y-2">
                  {coachingData.insights.map((insight: string, index: number) => (
                    <li key={index} className="text-gray-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-1">💡</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {coachingData.recommendations && coachingData.recommendations.length > 0 && (
              <div className="bg-yellow-900/20 rounded-lg p-6 border border-yellow-500/30">
                <h4 className="text-lg font-semibold text-yellow-400 mb-4">📋 Recommendations</h4>
                <ul className="space-y-2">
                  {coachingData.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="text-gray-300 flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">→</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coaching Analysis Error */}
      {coachingError && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="font-semibold text-red-400">Coaching Analysis Failed</h3>
          </div>
          <p className="text-red-200">{coachingError}</p>
        </div>
      )}

      {/* Champions Analysis Results */}
      {championsData && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-green-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-green-400" />
            <h3 className="text-2xl font-bold text-white">Champion Recommendations</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-400" />
                Champion Analysis
              </h4>
              <p className="text-gray-300 leading-relaxed">
                {championsData.analysis}
              </p>
            </div>

            {championsData.recommendations && championsData.recommendations.length > 0 && (
              <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                <h4 className="text-lg font-semibold text-green-400 mb-4">🎯 Champion Recommendations</h4>
                <ul className="space-y-2">
                  {championsData.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-1">⭐</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Champions Analysis Error */}
      {championsError && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="font-semibold text-red-400">Champion Analysis Failed</h3>
          </div>
          <p className="text-red-200">{championsError}</p>
        </div>
      )}

      {/* Welcome State */}
      {!performanceData && !coachingData && !championsData && 
       !performanceLoading && !coachingLoading && !championsLoading &&
       !performanceError && !coachingError && !championsError && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 text-center">
          <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Ready for AI Analysis</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Choose an analysis type above to get personalized insights powered by advanced AI. 
            Our system will analyze your recent matches, performance patterns, and provide 
            actionable recommendations to improve your gameplay.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm max-w-4xl mx-auto">
            <div className="bg-purple-900/20 rounded-lg p-4">
              <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h4 className="text-purple-300 font-semibold mb-2">Performance Analysis</h4>
              <p className="text-gray-400">Comprehensive review of your gameplay strengths and weaknesses</p>
            </div>
            <div className="bg-blue-900/20 rounded-lg p-4">
              <Lightbulb className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h4 className="text-blue-300 font-semibold mb-2">Coaching Insights</h4>
              <p className="text-gray-400">Personalized tips and strategies to improve your rank</p>
            </div>
            <div className="bg-green-900/20 rounded-lg p-4">
              <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h4 className="text-green-300 font-semibold mb-2">Champion Recommendations</h4>
              <p className="text-gray-400">Best champions that match your playstyle and current meta</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
