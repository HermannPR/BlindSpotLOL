import express from 'express';
import riotAPI from '../services/riotAPI';
import databaseService from '../services/database';
import logger from '../utils/logger';

const router = express.Router();

// Test Riot API key
router.get('/test-api', async (req, res) => {
  try {
    const isValid = await riotAPI.validateApiKey();
    const regions = riotAPI.getAvailableRegions();
    
    res.json({
      apiKeyValid: isValid,
      availableRegions: regions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'API test failed',
      message: error.message,
    });
  }
});

// Get summoner data and stats
router.get('/:region/:name', async (req, res) => {
  try {
    const { region, name } = req.params;
    
    logger.info(`Summoner lookup request: ${name} in ${region}`);

    // Validate region
    const availableRegions = riotAPI.getAvailableRegions();
    if (!availableRegions.includes(region)) {
      return res.status(400).json({
        error: 'Invalid region',
        message: `Region must be one of: ${availableRegions.join(', ')}`,
      });
    }

    let summoner;
    
    // Check if name contains # (Riot ID format)
    if (name.includes('#')) {
      const [gameName, tagLine] = name.split('#');
      logger.info(`Using Riot ID format: ${gameName}#${tagLine}`);
      summoner = await riotAPI.getSummonerByRiotId(region, gameName, tagLine);
    } else {
      // Try legacy summoner name format first
      logger.info(`Using legacy summoner name format: ${name}`);
      try {
        summoner = await riotAPI.getSummonerByName(region, name);
      } catch (error: any) {
        if (error.message.includes('not found') || error.message.includes('permissions')) {
          return res.status(400).json({
            error: 'Summoner lookup failed',
            message: 'Please use the format "GameName#TagLine" (e.g. "Doublelift#NA1")',
            suggestion: `Try ${name}#${region.toUpperCase()}`
          });
        }
        throw error;
      }
    }
      // Save summoner to database
    await databaseService.saveSummoner({
      puuid: summoner.puuid,
      summoner_id: summoner.id,
      account_id: summoner.accountId,
      name: name, // Use the original requested name since summoner data doesn't include name anymore
      region: region,
      level: summoner.summonerLevel,
      profile_icon_id: summoner.profileIconId,
      revision_date: summoner.revisionDate,
    });    // Get ranked data
    let rankedData = [];
    try {
      rankedData = await riotAPI.getSummonerRanked(region, summoner.puuid);
    } catch (error: any) {
      logger.warn(`Failed to fetch ranked data: ${error.message}`);
      // Continue without ranked data - set default values
      rankedData = [{
        queueType: 'RANKED_SOLO_5x5',
        tier: 'UNRANKED',
        rank: '',
        leaguePoints: 0,
        wins: 0,
        losses: 0,
        hotStreak: false,
        veteran: false,
        freshBlood: false,
        inactive: false
      }];
    }    // Get match history (last 25 matches for comprehensive analysis)
    const matchIds = await riotAPI.getMatchHistory(region, summoner.puuid, 25);
    
    // Get detailed match data
    const matches = [];
    for (const matchId of matchIds.slice(0, 20)) { // Analyze 20 matches for deeper insights
      try {
        const matchData = await riotAPI.getMatchDetails(region, matchId);
        
        // Find the current player's data in the match
        const playerData = matchData.info.participants.find(
          (p: any) => p.puuid === summoner.puuid
        );

        if (playerData) {
          matches.push({
            matchId: matchData.metadata.matchId,
            gameCreation: matchData.info.gameCreation,
            gameDuration: matchData.info.gameDuration,
            gameMode: matchData.info.gameMode,
            queueId: matchData.info.queueId,
            player: {
              championName: playerData.championName,
              championId: playerData.championId,
              kills: playerData.kills,
              deaths: playerData.deaths,
              assists: playerData.assists,
              win: playerData.win,
              totalDamageDealtToChampions: playerData.totalDamageDealtToChampions,
              visionScore: playerData.visionScore,
              goldEarned: playerData.goldEarned,
              totalMinionsKilled: playerData.totalMinionsKilled,
              item0: playerData.item0,
              item1: playerData.item1,
              item2: playerData.item2,
              item3: playerData.item3,
              item4: playerData.item4,
              item5: playerData.item5,
              item6: playerData.item6,
            },
          });
        }        // Save match data to database
        const participants = matchData.info.participants.map((p: any) => ({
          match_id: matchData.metadata.matchId,
          puuid: p.puuid,
          champion_id: p.championId,
          champion_name: p.championName,
          team_id: p.teamId || 0,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          win: p.win,
          total_damage_dealt_to_champions: p.totalDamageDealtToChampions,
          vision_score: p.visionScore,
          gold_earned: p.goldEarned,
          total_minions_killed: p.totalMinionsKilled,
          item0: p.item0 || 0,
          item1: p.item1 || 0,
          item2: p.item2 || 0,
          item3: p.item3 || 0,
          item4: p.item4 || 0,
          item5: p.item5 || 0,
          item6: p.item6 || 0,
        }));

        await databaseService.saveMatch({
          match_id: matchData.metadata.matchId,
          region: region,
          game_duration: matchData.info.gameDuration,
          game_mode: matchData.info.gameMode,
          game_version: matchData.info.gameVersion,
          queue_id: matchData.info.queueId,
          game_creation: matchData.info.gameCreation,
        }, participants);

      } catch (matchError) {
        logger.warn(`Failed to fetch match ${matchId}:`, matchError);
        // Continue with other matches
      }
    }

    // Get player statistics from database
    const playerStats = await databaseService.getPlayerStats(summoner.puuid, region, 20);

    // Calculate basic stats from recent matches
    const totalGames = matches.length;
    const wins = matches.filter(match => match.player.win).length;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    
    const avgKills = totalGames > 0 ? 
      matches.reduce((sum, match) => sum + match.player.kills, 0) / totalGames : 0;
    const avgDeaths = totalGames > 0 ? 
      matches.reduce((sum, match) => sum + match.player.deaths, 0) / totalGames : 0;
    const avgAssists = totalGames > 0 ? 
      matches.reduce((sum, match) => sum + match.player.assists, 0) / totalGames : 0;

    const response = {
      summoner: {
        name: summoner.name,
        level: summoner.summonerLevel,
        profileIconId: summoner.profileIconId,
        puuid: summoner.puuid,
      },
      ranked: rankedData,
      stats: {
        totalGames,
        wins,
        losses: totalGames - wins,
        winRate: parseFloat(winRate.toFixed(1)),
        averageKDA: {
          kills: parseFloat(avgKills.toFixed(1)),
          deaths: parseFloat(avgDeaths.toFixed(1)),
          assists: parseFloat(avgAssists.toFixed(1)),
          ratio: avgDeaths > 0 ? parseFloat(((avgKills + avgAssists) / avgDeaths).toFixed(2)) : 0,
        },
      },
      recentMatches: matches,
      playerStats: playerStats,
      timestamp: new Date().toISOString(),
    };    logger.info(`Successfully fetched data for ${summoner.name} (${region})`);
    return res.json(response);

  } catch (error: any) {
    logger.error('Summoner lookup error:', error);
    
    if (error.message === 'Summoner not found') {
      return res.status(404).json({
        error: 'Summoner not found',
        message: 'The summoner name does not exist in this region',
      });
    }

    if (error.message === 'Invalid API key or insufficient permissions') {
      return res.status(500).json({
        error: 'API configuration error',
        message: 'Riot API key is invalid or missing',
      });
    }    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch summoner data',
    });
  }
});

export default router;
