import { query, transaction } from '../config/database';
import logger from '../utils/logger';

interface SummonerData {
  puuid: string;
  summoner_id: string;
  account_id: string;
  name: string;
  region: string;
  level: number;
  profile_icon_id: number;
  revision_date: number;
}

interface MatchData {
  match_id: string;
  game_creation: number;
  game_duration: number;
  game_mode: string;
  game_version: string;
  queue_id: number;
  region: string;
}

interface MatchParticipantData {
  match_id: string;
  puuid: string;
  champion_id: number;
  champion_name: string;
  team_id: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  total_damage_dealt_to_champions: number;
  vision_score: number;
  gold_earned: number;
  total_minions_killed: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
}

class DatabaseService {
  async saveSummoner(summonerData: SummonerData): Promise<void> {
    const insertQuery = `
      INSERT INTO summoners (puuid, summoner_id, account_id, name, region, level, profile_icon_id, revision_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        summoner_id = VALUES(summoner_id),
        account_id = VALUES(account_id),
        name = VALUES(name),
        level = VALUES(level),
        profile_icon_id = VALUES(profile_icon_id),
        revision_date = VALUES(revision_date),
        updated_at = CURRENT_TIMESTAMP
    `;

    try {
      await query(insertQuery, [
        summonerData.puuid,
        summonerData.summoner_id,
        summonerData.account_id,
        summonerData.name,
        summonerData.region,
        summonerData.level,
        summonerData.profile_icon_id,
        summonerData.revision_date,
      ]);

      logger.info(`Saved summoner data for ${summonerData.name} (${summonerData.region})`);
    } catch (error) {
      logger.error('Error saving summoner data:', error);
      throw error;
    }
  }

  async saveMatch(matchData: MatchData, participants: MatchParticipantData[]): Promise<void> {
    try {
      await transaction(async (connection) => {
        // Insert match data
        const matchQuery = `
          INSERT INTO matches (match_id, game_creation, game_duration, game_mode, game_version, queue_id, region)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            game_creation = VALUES(game_creation),
            game_duration = VALUES(game_duration),
            game_mode = VALUES(game_mode),
            game_version = VALUES(game_version),
            queue_id = VALUES(queue_id)
        `;

        await connection.execute(matchQuery, [
          matchData.match_id,
          matchData.game_creation,
          matchData.game_duration,
          matchData.game_mode,
          matchData.game_version,
          matchData.queue_id,
          matchData.region,
        ]);

        // Insert participants
        const participantQuery = `
          INSERT INTO match_participants (
            match_id, puuid, champion_id, champion_name, team_id, kills, deaths, assists,
            win, total_damage_dealt_to_champions, vision_score, gold_earned, total_minions_killed,
            item0, item1, item2, item3, item4, item5, item6
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            kills = VALUES(kills),
            deaths = VALUES(deaths),
            assists = VALUES(assists),
            win = VALUES(win),
            total_damage_dealt_to_champions = VALUES(total_damage_dealt_to_champions),
            vision_score = VALUES(vision_score),
            gold_earned = VALUES(gold_earned),
            total_minions_killed = VALUES(total_minions_killed),
            item0 = VALUES(item0),
            item1 = VALUES(item1),
            item2 = VALUES(item2),
            item3 = VALUES(item3),
            item4 = VALUES(item4),
            item5 = VALUES(item5),
            item6 = VALUES(item6)
        `;        for (const participant of participants) {
          // Ensure all parameters are defined and have default values
          const safeParticipant = {
            match_id: participant.match_id || '',
            puuid: participant.puuid || '',
            champion_id: participant.champion_id || 0,
            champion_name: participant.champion_name || '',
            team_id: participant.team_id || 0,
            kills: participant.kills || 0,
            deaths: participant.deaths || 0,
            assists: participant.assists || 0,
            win: participant.win || false,
            total_damage_dealt_to_champions: participant.total_damage_dealt_to_champions || 0,
            vision_score: participant.vision_score || 0,
            gold_earned: participant.gold_earned || 0,
            total_minions_killed: participant.total_minions_killed || 0,
            item0: participant.item0 || 0,
            item1: participant.item1 || 0,
            item2: participant.item2 || 0,
            item3: participant.item3 || 0,
            item4: participant.item4 || 0,
            item5: participant.item5 || 0,
            item6: participant.item6 || 0,
          };

          await connection.execute(participantQuery, [
            safeParticipant.match_id,
            safeParticipant.puuid,
            safeParticipant.champion_id,
            safeParticipant.champion_name,
            safeParticipant.team_id,
            safeParticipant.kills,
            safeParticipant.deaths,
            safeParticipant.assists,
            safeParticipant.win,
            safeParticipant.total_damage_dealt_to_champions,
            safeParticipant.vision_score,
            safeParticipant.gold_earned,
            safeParticipant.total_minions_killed,
            safeParticipant.item0,
            safeParticipant.item1,
            safeParticipant.item2,
            safeParticipant.item3,
            safeParticipant.item4,
            safeParticipant.item5,
            safeParticipant.item6,
          ]);
        }
      });

      logger.info(`Saved match data for ${matchData.match_id} with ${participants.length} participants`);
    } catch (error) {
      logger.error('Error saving match data:', error);
      throw error;
    }
  }
  async getPlayerStats(puuid: string, region: string, limit: number = 20): Promise<any> {
    try {
      // Ensure limit is a valid integer
      const safeLimit = Math.max(1, Math.min(100, parseInt(String(limit)) || 20));
      
      // Check if match_participants table exists and has data
      const countQuery = `
        SELECT COUNT(*) as count
        FROM match_participants mp
        JOIN matches m ON mp.match_id = m.match_id
        WHERE mp.puuid = ? AND m.region = ?
      `;

      const countResult = await query(countQuery, [puuid, region]);
      const matchCount = countResult[0]?.count || 0;

      if (matchCount === 0) {
        logger.info(`No matches found for puuid ${puuid} in region ${region}`);
        return this.getEmptyPlayerStats();
      }      const statsQuery = `
        SELECT 
          mp.*,
          m.game_duration,
          m.game_mode,
          m.queue_id,
          m.game_creation
        FROM match_participants mp
        JOIN matches m ON mp.match_id = m.match_id
        WHERE mp.puuid = ? AND m.region = ?
        ORDER BY m.game_creation DESC
        LIMIT ${safeLimit}
      `;

      const matches = await query(statsQuery, [puuid, region]);

      if (matches.length === 0) {
        return this.getEmptyPlayerStats();
      }

      // Calculate statistics
      const totalMatches = matches.length;
      const wins = matches.filter((match: any) => match.win).length;
      const losses = totalMatches - wins;
      const winRate = (wins / totalMatches) * 100;

      const totalKills = matches.reduce((sum: number, match: any) => sum + match.kills, 0);
      const totalDeaths = matches.reduce((sum: number, match: any) => sum + match.deaths, 0);
      const totalAssists = matches.reduce((sum: number, match: any) => sum + match.assists, 0);
      const totalDamage = matches.reduce((sum: number, match: any) => sum + match.total_damage_dealt_to_champions, 0);

      const averageKDA = {
        kills: parseFloat((totalKills / totalMatches).toFixed(1)),
        deaths: parseFloat((totalDeaths / totalMatches).toFixed(1)),
        assists: parseFloat((totalAssists / totalMatches).toFixed(1)),
      };

      // Champion statistics
      const championMap = new Map();
      matches.forEach((match: any) => {
        const championName = match.champion_name;
        if (!championMap.has(championName)) {
          championMap.set(championName, {
            name: championName,
            games: 0,
            wins: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
          });
        }

        const champion = championMap.get(championName);
        champion.games++;
        if (match.win) champion.wins++;
        champion.kills += match.kills;
        champion.deaths += match.deaths;
        champion.assists += match.assists;
      });

      const championStats = Array.from(championMap.values())
        .map((champion: any) => ({
          ...champion,
          winRate: parseFloat(((champion.wins / champion.games) * 100).toFixed(1)),
          averageKDA: {
            kills: parseFloat((champion.kills / champion.games).toFixed(1)),
            deaths: parseFloat((champion.deaths / champion.games).toFixed(1)),
            assists: parseFloat((champion.assists / champion.games).toFixed(1)),
          },
        }))
        .sort((a, b) => b.games - a.games);

      return {
        totalMatches,
        wins,
        losses,
        winRate: parseFloat(winRate.toFixed(1)),
        averageKDA,
        totalDamage,
        averageDamage: Math.round(totalDamage / totalMatches),
        championStats,
        recentMatches: matches.slice(0, 10),
      };
    } catch (error) {
      logger.error('Error getting player stats:', error);
      return this.getEmptyPlayerStats();
    }
  }

  private getEmptyPlayerStats() {
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageKDA: { kills: 0, deaths: 0, assists: 0 },
      totalDamage: 0,
      averageDamage: 0,
      championStats: [],
      recentMatches: [],
    };
  }

  async saveAIAnalysis(
    puuid: string,
    region: string,
    analysisType: 'performance' | 'recommendations' | 'champion_suggestions',
    analysisData: any,
    matchesAnalyzed: number
  ): Promise<void> {
    const insertQuery = `
      INSERT INTO ai_analysis (puuid, region, analysis_type, analysis_data, matches_analyzed, expires_at)
      VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
      ON DUPLICATE KEY UPDATE
        analysis_data = VALUES(analysis_data),
        matches_analyzed = VALUES(matches_analyzed),
        expires_at = VALUES(expires_at),
        updated_at = CURRENT_TIMESTAMP
    `;

    try {
      await query(insertQuery, [
        puuid,
        region,
        analysisType,
        JSON.stringify(analysisData),
        matchesAnalyzed,
      ]);

      logger.info(`Saved AI analysis for ${puuid} (${region}) - ${analysisType}`);
    } catch (error) {
      logger.error('Error saving AI analysis:', error);
      throw error;
    }
  }

  async getAIAnalysis(
    puuid: string,
    region: string,
    analysisType: 'performance' | 'recommendations' | 'champion_suggestions'
  ): Promise<any | null> {
    const selectQuery = `
      SELECT analysis_data, matches_analyzed, created_at, expires_at
      FROM ai_analysis
      WHERE puuid = ? AND region = ? AND analysis_type = ? AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    try {
      const result = await query(selectQuery, [puuid, region, analysisType]);
      
      if (result.length === 0) {
        return null;
      }

      return {
        analysisData: JSON.parse(result[0].analysis_data),
        matchesAnalyzed: result[0].matches_analyzed,
        createdAt: result[0].created_at,
        expiresAt: result[0].expires_at,
      };
    } catch (error) {
      logger.error('Error getting AI analysis:', error);
      return null;
    }
  }

  async getSummonerByPuuid(puuid: string, region: string): Promise<any | null> {
    const selectQuery = `
      SELECT *
      FROM summoners
      WHERE puuid = ? AND region = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    try {
      const result = await query(selectQuery, [puuid, region]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('Error getting summoner by PUUID:', error);
      return null;
    }
  }

  async getSummonerByName(name: string, region: string): Promise<any | null> {
    const selectQuery = `
      SELECT *
      FROM summoners
      WHERE name = ? AND region = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    try {
      const result = await query(selectQuery, [name, region]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('Error getting summoner by name:', error);
      return null;
    }
  }
}

export default new DatabaseService();
