import logger from '../utils/logger';
import MetaAnalysisService from './metaAnalysisService';

interface EnhancedMatchData {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  player: any;
  info?: any;
  enhancedMetrics?: {
    gamePhase: 'early' | 'mid' | 'late';
    durationCategory: 'short' | 'normal' | 'long';
    killParticipation: number;
    goldEfficiency: number;
    csPerMinute: number;
    damagePerMinute: number;
    visionScorePerMinute: number;
    earlyGameScore: number;
    midGameScore: number;
    lateGameScore: number;
    performanceScore: number;
    rolePerformance: number;
    averageEnemyRank: string;
    difficultyRating: number;
    teamComposition: string;
    championTier: string;
    metaScore: number;
    optimalBuild: boolean;
    metaComparison: {
      kdaVsMeta: number;
      csVsMeta: number;
      damageVsMeta: number;
    };
  };
}

class EnhancedDataProcessor {
  private static metaService = new MetaAnalysisService();
  
  static enhanceMatchData(matchData: any[]): EnhancedMatchData[] {
    try {
      return matchData.map(match => {
        const enhanced = { ...match };
        enhanced.enhancedMetrics = this.calculateEnhancedMetrics(match);
        return enhanced;
      });
    } catch (error) {
      logger.error('Error enhancing match data:', error);
      return matchData;
    }
  }

  private static calculateEnhancedMetrics(match: any) {
    try {
      const player = match.player;
      const duration = match.info?.gameDuration || match.gameDuration || 1800;
      const durationMinutes = duration / 60;
      
      const gamePhase = durationMinutes < 20 ? 'early' : durationMinutes < 35 ? 'mid' : 'late';
      const durationCategory = durationMinutes < 25 ? 'short' : durationMinutes > 40 ? 'long' : 'normal';
      
      const csPerMinute = (player.totalMinionsKilled || 0) / durationMinutes;
      const damagePerMinute = (player.totalDamageDealtToChampions || 0) / durationMinutes;
      const visionScorePerMinute = (player.visionScore || 0) / durationMinutes;
      const goldEfficiency = player.goldEarned > 0 ? (player.totalDamageDealtToChampions || 0) / player.goldEarned : 0;
      
      const kills = player.kills || 0;
      const assists = player.assists || 0;
      const estimatedTeamKills = Math.max(kills + assists + 5, 15);
      const killParticipation = (kills + assists) / estimatedTeamKills;
      
      const kda = player.deaths > 0 ? (kills + assists) / player.deaths : kills + assists;
      const earlyGameScore = this.calculatePhaseScore(player, 'early', durationMinutes);
      const midGameScore = this.calculatePhaseScore(player, 'mid', durationMinutes);
      const lateGameScore = this.calculatePhaseScore(player, 'late', durationMinutes);
      
      const performanceScore = this.calculateOverallPerformanceScore(player, kda, csPerMinute, damagePerMinute);
      const rolePerformance = this.calculateRolePerformance(player, csPerMinute, damagePerMinute, visionScorePerMinute);
      const difficultyRating = this.calculateDifficultyRating(match, durationMinutes);
      
      const championName = player.championName || '';
      const metaAnalysis = this.metaService.analyzeChampionMeta(championName, { kda, csPerMinute, damagePerMinute });
      const optimalBuild = this.checkOptimalBuild(player, championName);

      return {
        gamePhase,
        durationCategory,
        killParticipation: Math.round(killParticipation * 100) / 100,
        goldEfficiency: Math.round(goldEfficiency * 100) / 100,
        csPerMinute: Math.round(csPerMinute * 10) / 10,
        damagePerMinute: Math.round(damagePerMinute),
        visionScorePerMinute: Math.round(visionScorePerMinute * 10) / 10,
        earlyGameScore: Math.round(earlyGameScore * 10) / 10,
        midGameScore: Math.round(midGameScore * 10) / 10,
        lateGameScore: Math.round(lateGameScore * 10) / 10,
        performanceScore: Math.round(performanceScore * 10) / 10,
        rolePerformance: Math.round(rolePerformance * 10) / 10,
        averageEnemyRank: 'Unknown',
        difficultyRating: Math.round(difficultyRating * 10) / 10,
        teamComposition: 'Standard',
        championTier: metaAnalysis.tier || 'C',
        metaScore: metaAnalysis.metaScore || 5.0,
        optimalBuild,
        metaComparison: metaAnalysis.comparisons || { kdaVsMeta: 100, csVsMeta: 100, damageVsMeta: 100 }
      };
    } catch (error) {
      logger.error('Error calculating enhanced metrics:', error);
      return {
        gamePhase: 'mid' as const,
        durationCategory: 'normal' as const,
        killParticipation: 0.5,
        goldEfficiency: 1.0,
        csPerMinute: 5.0,
        damagePerMinute: 400,
        visionScorePerMinute: 1.0,
        earlyGameScore: 5.0,
        midGameScore: 5.0,
        lateGameScore: 5.0,
        performanceScore: 5.0,
        rolePerformance: 5.0,
        averageEnemyRank: 'Unknown',
        difficultyRating: 5.0,
        teamComposition: 'Standard',
        championTier: 'C',
        metaScore: 5.0,
        optimalBuild: false,
        metaComparison: { kdaVsMeta: 100, csVsMeta: 100, damageVsMeta: 100 }
      };
    }
  }

  private static calculatePhaseScore(player: any, phase: string, durationMinutes: number): number {
    const kda = player.deaths > 0 ? (player.kills + player.assists) / player.deaths : player.kills + player.assists;
    const baseScore = Math.min(10, Math.max(1, kda * 2));
    
    if (phase === 'early' && durationMinutes > 15) {
      return Math.min(baseScore + 1, 10);
    } else if (phase === 'late' && durationMinutes < 25) {
      return Math.max(baseScore - 1, 1);
    }
    
    return baseScore;
  }

  private static calculateOverallPerformanceScore(player: any, kda: number, csPerMinute: number, damagePerMinute: number): number {
    const kdaScore = Math.min(10, Math.max(1, kda * 2));
    const csScore = Math.min(10, Math.max(1, csPerMinute));
    const damageScore = Math.min(10, Math.max(1, damagePerMinute / 100));
    
    return (kdaScore * 0.4 + csScore * 0.3 + damageScore * 0.3);
  }

  private static calculateRolePerformance(player: any, csPerMinute: number, damagePerMinute: number, visionPerMinute: number): number {
    const highCS = csPerMinute > 6;
    const highDamage = damagePerMinute > 500;
    const highVision = visionPerMinute > 1.5;
    
    let roleType = 'unknown';
    if (highCS && highDamage) roleType = 'carry';
    else if (highCS && !highDamage) roleType = 'top';
    else if (!highCS && highDamage) roleType = 'jungle';
    else if (highVision) roleType = 'support';
    
    switch (roleType) {
      case 'carry':
        return (Math.min(csPerMinute / 7, 1) * 40 + Math.min(damagePerMinute / 600, 1) * 60);
      case 'top':
        return (Math.min(csPerMinute / 6, 1) * 50 + Math.min(damagePerMinute / 400, 1) * 50);
      case 'jungle':
        return (Math.min(damagePerMinute / 500, 1) * 60 + Math.min(visionPerMinute / 1.5, 1) * 40);
      case 'support':
        return (Math.min(visionPerMinute / 2, 1) * 70 + Math.min(player.assists / 10, 1) * 30);
      default:
        return 5;
    }
  }

  private static calculateDifficultyRating(match: any, durationMinutes: number): number {
    const player = match.player;
    const isWin = player.win;
    
    const durationFactor = Math.min(durationMinutes / 40, 1.5);
    const resultFactor = isWin ? 0.7 : 1.3;
    
    const kda = player.deaths > 0 ? (player.kills + player.assists) / player.deaths : player.kills + player.assists;
    const kdaFactor = kda < 1 ? 1.5 : kda > 3 ? 0.5 : 1;
    
    const baseDifficulty = 5;
    const adjustedDifficulty = baseDifficulty * durationFactor * resultFactor * kdaFactor;
    
    return Math.max(1, Math.min(adjustedDifficulty, 10));
  }

  private static checkOptimalBuild(player: any, championName: string): boolean {
    try {
      const optimalBuild = this.metaService.getOptimalBuild(championName);
      if (!optimalBuild) return true;
      
      const playerItems = [
        player.item0, player.item1, player.item2,
        player.item3, player.item4, player.item5, player.item6
      ].filter(item => item && item !== 0);
      
      const coreItems = optimalBuild.items.core;
      const coreItemsFound = coreItems.filter(coreItem => playerItems.includes(coreItem)).length;
      
      return coreItemsFound >= Math.min(2, coreItems.length);
    } catch (error) {
      return true;
    }
  }

  static generateEnhancedSummary(enhancedMatches: EnhancedMatchData[]): any {
    try {
      const recentMatches = enhancedMatches.slice(0, 10);
      
      if (recentMatches.length === 0) {
        return {
          avgMetrics: {
            csPerMinute: 0,
            damagePerMinute: 0,
            visionScorePerMinute: 0,
            killParticipation: 0,
            goldEfficiency: 0
          },
          performanceByPhase: {
            earlyGame: 5.0,
            midGame: 5.0,
            lateGame: 5.0
          },
          consistencyScores: {
            overall: 5.0,
            kda: 5.0,
            cs: 5.0,
            damage: 5.0
          },
          gameContext: {
            averageDifficulty: 5.0,
            shortGameWinRate: 50,
            longGameWinRate: 50
          }
        };
      }
      
      const avgMetrics = {
        csPerMinute: this.average(recentMatches.map(m => m.enhancedMetrics?.csPerMinute || 0)),
        damagePerMinute: this.average(recentMatches.map(m => m.enhancedMetrics?.damagePerMinute || 0)),
        visionScorePerMinute: this.average(recentMatches.map(m => m.enhancedMetrics?.visionScorePerMinute || 0)),
        killParticipation: this.average(recentMatches.map(m => m.enhancedMetrics?.killParticipation || 0)),
        goldEfficiency: this.average(recentMatches.map(m => m.enhancedMetrics?.goldEfficiency || 0))
      };
      
      const performanceByPhase = {
        earlyGame: this.average(recentMatches.map(m => m.enhancedMetrics?.earlyGameScore || 5)),
        midGame: this.average(recentMatches.map(m => m.enhancedMetrics?.midGameScore || 5)),
        lateGame: this.average(recentMatches.map(m => m.enhancedMetrics?.lateGameScore || 5))
      };
      
      const kdaValues = recentMatches.map(m => {
        const player = m.player;
        if (!player) return 1;
        const kills = player.kills || 0;
        const deaths = Math.max(player.deaths || 1, 1);
        const assists = player.assists || 0;
        return (kills + assists) / deaths;
      });
      
      const csValues = recentMatches.map(m => m.enhancedMetrics?.csPerMinute || 0);
      const damageValues = recentMatches.map(m => m.enhancedMetrics?.damagePerMinute || 0);
      
      const consistencyScores = {
        overall: this.average([
          this.calculateConsistency(kdaValues),
          this.calculateConsistency(csValues),
          this.calculateConsistency(damageValues)
        ]),
        kda: this.calculateConsistency(kdaValues),
        cs: this.calculateConsistency(csValues),
        damage: this.calculateConsistency(damageValues)
      };
      
      const shortGames = recentMatches.filter(m => (m.gameDuration || 1800) < 1500);
      const longGames = recentMatches.filter(m => (m.gameDuration || 1800) > 2100);
      
      const gameContext = {
        averageDifficulty: this.average(recentMatches.map(m => m.enhancedMetrics?.difficultyRating || 5)),
        shortGameWinRate: shortGames.length > 0 ? 
          (shortGames.filter(m => m.player?.win).length / shortGames.length) * 100 : 50,
        longGameWinRate: longGames.length > 0 ? 
          (longGames.filter(m => m.player?.win).length / longGames.length) * 100 : 50
      };
        // Calculate trends and additional metrics needed by AI service
      const performanceValues = Object.values(performanceByPhase);
      const strongestPhase = performanceValues.indexOf(Math.max(...performanceValues));
      const phaseNames = ['Early Game', 'Mid Game', 'Late Game'];
      
      const avgDuration = this.average(recentMatches.map(m => (m.gameDuration || 1800) / 60));
      const preferredGameLength = avgDuration < 25 ? 'Short games' : avgDuration > 40 ? 'Long games' : 'Standard games';
      
      const difficultyValues = recentMatches.map(m => m.enhancedMetrics?.difficultyRating || 5);
      const avgDifficulty = this.average(difficultyValues);
      const difficultyTolerance = this.calculateConsistency(difficultyValues);
      
      const trends = {
        strongestPhase: phaseNames[strongestPhase],
        consistencyRating: consistencyScores.overall,
        preferredGameLength,
        difficultyTolerance: Math.round(difficultyTolerance * 10) / 10
      };

      // Update avgMetrics to include all expected properties
      const enhancedAvgMetrics = {
        ...avgMetrics,
        visionPerMinute: avgMetrics.visionScorePerMinute,
        earlyGameScore: performanceByPhase.earlyGame,
        midGameScore: performanceByPhase.midGame,
        lateGameScore: performanceByPhase.lateGame,
        avgDifficulty
      };

      return {
        avgMetrics: enhancedAvgMetrics,
        performanceByPhase,
        consistencyScores,
        gameContext,
        trends
      };
    } catch (error) {
      logger.error('Error generating enhanced summary:', error);
      return {
        avgMetrics: { csPerMinute: 0, damagePerMinute: 0, visionScorePerMinute: 0, killParticipation: 0, goldEfficiency: 0 },
        performanceByPhase: { earlyGame: 5.0, midGame: 5.0, lateGame: 5.0 },
        consistencyScores: { overall: 5.0, kda: 5.0, cs: 5.0, damage: 5.0 },
        gameContext: { averageDifficulty: 5.0, shortGameWinRate: 50, longGameWinRate: 50 }
      };
    }
  }

  static generateMetaAnalysis(enhancedMatches: EnhancedMatchData[], rankedData: any[]): any {
    try {
      const championsPlayed = [...new Set(enhancedMatches.map(m => m.player?.championName).filter(Boolean))];
      const currentRank = rankedData[0]?.tier || 'UNRANKED';
      
      const metaRecommendations = this.metaService.generateMetaRecommendations(championsPlayed, currentRank);
      const metaContext = this.metaService.getMetaContext();
      
      const championMetaAnalysis = championsPlayed.map(champ => {
        try {
          const championMatches = enhancedMatches.filter(m => m.player?.championName === champ);
          
          if (championMatches.length === 0) {
            return {
              champion: champ,
              gamesPlayed: 0,
              metaAnalysis: {
                tier: 'C',
                metaScore: 5.0,
                comparisons: { kdaVsMeta: 100, csVsMeta: 100, damageVsMeta: 100 }
              },
              optimalBuildUsage: 0
            };
          }

          const avgPerformance = {
            winRate: (championMatches.filter(m => m.player?.win).length / championMatches.length) * 100,
            kda: championMatches.reduce((sum, m) => {
              const kills = m.player?.kills || 0;
              const deaths = Math.max(m.player?.deaths || 1, 1);
              const assists = m.player?.assists || 0;
              return sum + ((kills + assists) / deaths);
            }, 0) / championMatches.length,
            csPerMinute: championMatches.reduce((sum, m) => sum + (m.enhancedMetrics?.csPerMinute || 0), 0) / championMatches.length,
            damagePerMinute: championMatches.reduce((sum, m) => sum + (m.enhancedMetrics?.damagePerMinute || 0), 0) / championMatches.length
          };
          
          const metaAnalysis = this.metaService.analyzeChampionMeta(champ, avgPerformance);
          
          if (!metaAnalysis.comparisons) {
            metaAnalysis.comparisons = { kdaVsMeta: 100, csVsMeta: 100, damageVsMeta: 100 };
          }

          return {
            champion: champ,
            gamesPlayed: championMatches.length,
            metaAnalysis,
            optimalBuildUsage: championMatches.filter(m => m.enhancedMetrics?.optimalBuild).length / championMatches.length * 100
          };
        } catch (error) {
          logger.error(`Error analyzing champion ${champ}:`, error);
          return {
            champion: champ,
            gamesPlayed: 0,
            metaAnalysis: {
              tier: 'C',
              metaScore: 5.0,
              comparisons: { kdaVsMeta: 100, csVsMeta: 100, damageVsMeta: 100 }
            },
            optimalBuildUsage: 0
          };
        }
      });
      
      const validAnalysis = championMetaAnalysis.filter(c => c.gamesPlayed > 0);
      const overallMetaScore = validAnalysis.length > 0 ? 
        Math.round(validAnalysis.reduce((sum, c) => sum + (c.metaAnalysis.metaScore || 5), 0) / validAnalysis.length * 10) / 10 :
        5.0;

      return {
        metaContext: metaContext || {
          currentPatch: "14.23",
          strongRoles: ["ADC", "Support", "Jungle"],
          emergingPicks: [],
          buffedChampions: [],
          nerfedChampions: []
        },
        championAnalysis: championMetaAnalysis,
        recommendations: metaRecommendations || {
          strengthenPool: [],
          maintainFocus: [],
          considerReplacing: []
        },
        overallMetaScore
      };
    } catch (error) {
      logger.error('Error generating meta analysis:', error);
      return {
        metaContext: {
          currentPatch: "14.23",
          strongRoles: ["ADC", "Support", "Jungle"],
          emergingPicks: [],
          buffedChampions: [],
          nerfedChampions: []
        },
        championAnalysis: [],
        recommendations: {
          strengthenPool: [],
          maintainFocus: [],
          considerReplacing: []
        },
        overallMetaScore: 5.0
      };
    }
  }

  private static average(numbers: number[]): number {
    return numbers.length > 0 ? Math.round((numbers.reduce((sum, n) => sum + n, 0) / numbers.length) * 100) / 100 : 0;
  }

  private static calculateConsistency(values: number[]): number {
    if (values.length <= 1) return 5;
    
    const avg = this.average(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(1, Math.min(10, 10 - standardDeviation * 2));
  }
}

export default EnhancedDataProcessor;
