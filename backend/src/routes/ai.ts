import { Router, Request, Response } from 'express';
import aiService from '../services/aiService';
import riotAPIService from '../services/riotAPI';
import databaseService from '../services/database';
import logger from '../utils/logger';
import { aiLimiter } from '../middleware/rateLimiter';
import MetaAnalysisService from '../services/metaAnalysisService';
import EnhancedDataProcessor from '../services/enhancedDataProcessor';

const router = Router();

// Apply AI-specific rate limiting
router.use(aiLimiter);

// Analyze player performance
router.post('/analyze/:region/:summonerName', async (req: Request, res: Response) => {
  try {
    const { region, summonerName } = req.params;
    const { analysisType = 'performance' } = req.body;    logger.info(`Starting AI analysis for ${summonerName} in ${region}`);    // Get summoner data
    const summonerData = await riotAPIService.getSummonerByName(region, summonerName);
      // Get ranked data
    const rankedData = await riotAPIService.getSummonerRanked(region, summonerData.puuid);
      // Get recent matches
    const matchIds = await riotAPIService.getMatchHistory(region, summonerData.puuid, 25);
    const matchData = [];
    
    // Get detailed match data (analyze 20 games for comprehensive AI analysis)
    for (const matchId of matchIds.slice(0, 20)) {
      try {
        const matchDetails = await riotAPIService.getMatchDetails(region, matchId);
        
        // Find the player's data in the match
        const participantIndex = matchDetails.metadata.participants.indexOf(summonerData.puuid);
        if (participantIndex !== -1) {
          const participant = matchDetails.info.participants[participantIndex];
          
          matchData.push({
            matchId,
            gameCreation: matchDetails.info.gameCreation,
            gameDuration: matchDetails.info.gameDuration,
            gameMode: matchDetails.info.gameMode,
            queueId: matchDetails.info.queueId,
            player: {
              championName: participant.championName,
              championId: participant.championId,
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              win: participant.win,
              totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
              visionScore: participant.visionScore,
              goldEarned: participant.goldEarned,
              totalMinionsKilled: participant.totalMinionsKilled,
              item0: participant.item0,
              item1: participant.item1,
              item2: participant.item2,
              item3: participant.item3,
              item4: participant.item4,
              item5: participant.item5,
              item6: participant.item6
            }
          });
        }
      } catch (matchError) {
        logger.warn(`Failed to get match details for ${matchId}:`, matchError);
      }
    }

    // Generate AI analysis
    const aiAnalysis = await aiService.analyzePlayerPerformance({
      summonerData,
      matchData,
      rankedData,
      analysisType: analysisType as 'performance' | 'improvement' | 'champion_recommendation' | 'coaching'
    });    // Cache the analysis in database
    try {
      await databaseService.saveAIAnalysis(
        summonerData.puuid,
        region,
        'performance',
        {
          analysis: aiAnalysis.analysis,
          insights: aiAnalysis.insights,
          recommendations: aiAnalysis.recommendations,
          strengths: aiAnalysis.strengths,
          weaknesses: aiAnalysis.weaknesses,
          score: aiAnalysis.score,
          metadata: {
            summonerName,
            rankedTiers: rankedData.map(r => `${r.tier} ${r.rank}`)
          }
        },
        matchData.length
      );
    } catch (dbError) {
      logger.warn('Failed to cache AI analysis:', dbError);
    }

    res.json({
      success: true,
      analysis: aiAnalysis,
      metadata: {
        summonerLevel: summonerData.summonerLevel,
        rankedInfo: rankedData.map(r => ({
          queueType: r.queueType,
          tier: r.tier,
          rank: r.rank,
          leaguePoints: r.leaguePoints
        })),
        matchesAnalyzed: matchData.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('AI analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI analysis'
    });
  }
});

// Get coaching insights
router.post('/coaching/:region/:summonerName', async (req: Request, res: Response) => {
  try {
    const { region, summonerName } = req.params;    logger.info(`Generating coaching insights for ${summonerName} in ${region}`);    // Get summoner data
    const summonerData = await riotAPIService.getSummonerByName(region, summonerName);
    const rankedData = await riotAPIService.getSummonerRanked(region, summonerData.puuid);    const matchIds = await riotAPIService.getMatchHistory(region, summonerData.puuid, 25);
    
    const matchData = [];
    for (const matchId of matchIds.slice(0, 20)) {
      try {
        const matchDetails = await riotAPIService.getMatchDetails(region, matchId);
        const participantIndex = matchDetails.metadata.participants.indexOf(summonerData.puuid);
        
        if (participantIndex !== -1) {
          const participant = matchDetails.info.participants[participantIndex];
          matchData.push({
            matchId,
            gameCreation: matchDetails.info.gameCreation,
            gameDuration: matchDetails.info.gameDuration,
            gameMode: matchDetails.info.gameMode,
            player: {
              championName: participant.championName,
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              win: participant.win,
              totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
              visionScore: participant.visionScore,
              totalMinionsKilled: participant.totalMinionsKilled
            }
          });
        }
      } catch (matchError) {
        logger.warn(`Failed to get match details for coaching: ${matchError}`);
      }
    }

    // Generate coaching insights
    const coachingAnalysis = await aiService.generateCoachingInsights({
      summonerData,
      matchData,
      rankedData,
      analysisType: 'coaching'
    });

    res.json({
      success: true,
      coaching: coachingAnalysis,
      metadata: {
        matchesAnalyzed: matchData.length,
        currentRank: rankedData[0] ? `${rankedData[0].tier} ${rankedData[0].rank}` : 'Unranked',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('Coaching analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate coaching insights'
    });
  }
});

// Get champion recommendations
router.post('/champions/:region/:summonerName', async (req: Request, res: Response) => {
  try {
    const { region, summonerName } = req.params;    logger.info(`Generating champion recommendations for ${summonerName} in ${region}`);    const summonerData = await riotAPIService.getSummonerByName(region, summonerName);
    const rankedData = await riotAPIService.getSummonerRanked(region, summonerData.puuid);    const matchIds = await riotAPIService.getMatchHistory(region, summonerData.puuid, 25);
    
    const matchData = [];
    for (const matchId of matchIds.slice(0, 20)) {
      try {
        const matchDetails = await riotAPIService.getMatchDetails(region, matchId);
        const participantIndex = matchDetails.metadata.participants.indexOf(summonerData.puuid);
        
        if (participantIndex !== -1) {
          const participant = matchDetails.info.participants[participantIndex];
          matchData.push({
            matchId,
            gameMode: matchDetails.info.gameMode,
            queueId: matchDetails.info.queueId,
            player: {
              championName: participant.championName,
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              win: participant.win,
              totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
              role: participant.teamPosition || participant.individualPosition
            }
          });
        }
      } catch (matchError) {
        logger.warn(`Failed to get match for champion analysis: ${matchError}`);
      }
    }

    const championAnalysis = await aiService.recommendChampions({
      summonerData,
      matchData,
      rankedData,
      analysisType: 'champion_recommendation'
    });

    res.json({
      success: true,
      recommendations: championAnalysis,
      metadata: {
        matchesAnalyzed: matchData.length,
        currentRank: rankedData[0] ? `${rankedData[0].tier} ${rankedData[0].rank}` : 'Unranked',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('Champion recommendation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate champion recommendations'
    });
  }
});

// Validate AI API key
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const isValid = await aiService.validateApiKey();
    
    res.json({
      success: true,
      apiKeyValid: isValid,
      provider: process.env.AI_API_PROVIDER || 'groq',
      model: process.env.AI_MODEL || 'mixtral-8x7b-32768'
    });
  } catch (error: any) {
    logger.error('AI validation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate AI service'
    });
  }
});

// Get cached analysis
router.get('/history/:puuid', async (req: Request, res: Response) => {
  try {
    const { puuid } = req.params;
    
    // TODO: Implement getAIAnalysisHistory method in database service
    res.json({
      success: true,
      analyses: [],
      count: 0,
      message: 'Analysis history feature coming soon'
    });
  } catch (error: any) {
    logger.error('Failed to get AI analysis history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analysis history'
    });
  }
});

// Get current meta analysis
router.get('/meta-analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    // Create instance of the meta analysis service
    const metaAnalysisService = new MetaAnalysisService();
    
    // Get current meta context
    const metaContext = metaAnalysisService.getMetaContext();
      if (!metaContext) {
      res.status(503).json({
        success: false,
        error: 'Meta analysis data not available'
      });
      return;
    }
    
    // Generate a simple summary of meta context
    const summary = {
      patch: metaContext.currentPatch,
      patchDate: metaContext.patchDate,
      majorChanges: metaContext.majorChanges.length,
      metaShifts: metaContext.metaShifts.length,
      strongRoles: metaContext.strongRoles,
      emergingPicks: metaContext.emergingPicks,
      nerfedChampions: metaContext.nerfedChampions,
      buffedChampions: metaContext.buffedChampions
    };
    
    res.json({
      success: true,
      meta: metaContext,
      summary: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to get meta analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get meta analysis'
    });
  }
});

export default router;
