import axios from 'axios';
import logger from '../utils/logger';

interface SummonerData {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

interface MatchData {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameId: number;
    gameMode: string;
    gameVersion: string;
    queueId: number;
    participants: any[];
  };
}

class RiotAPIService {
  private apiKey: string;
  private baseUrls: { [key: string]: string };
  private regionalClusters: { [key: string]: string };
  constructor() {
    this.apiKey = process.env.RIOT_API_KEY || '';
    
    // Debug logging for API key
    if (this.apiKey) {
      logger.info(`✅ Riot API key loaded: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 5)}`);
    } else {
      logger.error('❌ Riot API key not found in environment variables');
    }
      this.baseUrls = {
      'na1': 'https://na1.api.riotgames.com',
      'euw1': 'https://euw1.api.riotgames.com',
      'eun1': 'https://eun1.api.riotgames.com',
      'kr': 'https://kr.api.riotgames.com',
      'br1': 'https://br1.api.riotgames.com',
      'la1': 'https://la1.api.riotgames.com',
      'la2': 'https://la2.api.riotgames.com',
      'oc1': 'https://oc1.api.riotgames.com',
      'tr1': 'https://tr1.api.riotgames.com',
      'ru': 'https://ru.api.riotgames.com',
      'jp1': 'https://jp1.api.riotgames.com',
      'ph2': 'https://ph2.api.riotgames.com',
      'sg2': 'https://sg2.api.riotgames.com',
      'th2': 'https://th2.api.riotgames.com',
      'tw2': 'https://tw2.api.riotgames.com',
      'vn2': 'https://vn2.api.riotgames.com',
    };this.regionalClusters = {
      // Americas cluster
      'na1': 'americas',
      'br1': 'americas',
      'la1': 'americas',
      'la2': 'americas',
      'oc1': 'americas',
      // Europe cluster  
      'euw1': 'europe',
      'eun1': 'europe',
      'tr1': 'europe',
      'ru': 'europe',
      // Asia cluster
      'kr': 'asia',
      'jp1': 'asia',
      // Add missing regions
      'ph2': 'asia',
      'sg2': 'asia',
      'th2': 'asia',
      'tw2': 'asia',
      'vn2': 'asia',
    };

    if (!this.apiKey) {
      logger.warn('Riot API key not provided. Some features will not work.');
    }
  }

  private getRegionalCluster(region: string): string {
    return this.regionalClusters[region] || 'americas';
  }

  private getClusterUrl(cluster: string): string {
    return `https://${cluster}.api.riotgames.com`;
  }
  private async makeRequest(url: string, retries = 3): Promise<any> {
    try {
      const response = await axios.get(url, {
        headers: {
          'X-Riot-Token': this.apiKey,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429 && retries > 0) {
        // Rate limited, wait and retry
        const retryAfter = error.response.headers['retry-after'] || 1;
        logger.warn(`Rate limited. Retrying in ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.makeRequest(url, retries - 1);
      }

      if (error.response?.status === 404) {
        logger.error(`404 Error for URL: ${url}`);
        throw new Error('Summoner not found');
      }      if (error.response?.status === 403) {
        logger.error(`403 Error for URL: ${url}`);
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
        logger.error('Riot API Key Error: The API key may be expired, invalid, or missing.');
        logger.error('Get a new API key from: https://developer.riotgames.com/');
        throw new Error('Invalid API key or insufficient permissions');
      }

      logger.error('Riot API request failed:', {
        url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      throw error;
    }
  }async getSummonerByName(region: string, summonerName: string): Promise<SummonerData> {
    if (!this.apiKey) {
      throw new Error('Riot API key not configured');
    }

    // Check if summonerName contains # (RiotID format)
    if (summonerName.includes('#')) {
      const [gameName, tagLine] = summonerName.split('#');
      return await this.getSummonerByRiotId(region, gameName, tagLine);
    }

    // Fallback to legacy by-name endpoint (will be deprecated)
    const baseUrl = this.baseUrls[region];
    if (!baseUrl) {
      throw new Error(`Unsupported region: ${region}`);
    }

    const url = `${baseUrl}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
    
    logger.info(`Fetching summoner data for ${summonerName} in ${region} (legacy endpoint)`);
    logger.info(`Using URL: ${url}`);
    
    return await this.makeRequest(url);
  }async getMatchHistory(region: string, puuid: string, count = 20): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('Riot API key not configured');
    }

    const cluster = this.getRegionalCluster(region);
    const clusterUrl = this.getClusterUrl(cluster);
    
    const url = `${clusterUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
    
    logger.info(`Fetching match history for puuid ${puuid} in cluster ${cluster}`);
    return await this.makeRequest(url);
  }

  async getMatchDetails(region: string, matchId: string): Promise<MatchData> {
    if (!this.apiKey) {
      throw new Error('Riot API key not configured');
    }

    const cluster = this.getRegionalCluster(region);
    const clusterUrl = this.getClusterUrl(cluster);
    
    const url = `${clusterUrl}/lol/match/v5/matches/${matchId}`;
    
    logger.info(`Fetching match details for ${matchId} in cluster ${cluster}`);
    return await this.makeRequest(url);
  }  async getSummonerRanked(region: string, puuid: string): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Riot API key not configured');
    }

    const baseUrl = this.baseUrls[region];
    if (!baseUrl) {
      throw new Error(`Unsupported region: ${region}`);
    }

    // Use the CORRECT PUUID-based endpoint (this DOES exist according to official API docs)
    const url = `${baseUrl}/lol/league/v4/entries/by-puuid/${puuid}`;
    
    logger.info(`Fetching ranked data for PUUID ${puuid} in ${region}`);
    logger.info(`Using URL: ${url}`);
    
    try {
      const result = await this.makeRequest(url);
      logger.info(`✅ Successfully fetched ranked data for PUUID ${puuid}`);
      return result;
    } catch (error: any) {
      logger.error(`❌ Failed to fetch ranked data for PUUID ${puuid}:`, error.message);
      
      // Provide detailed error analysis
      if (error.response?.status === 403) {
        logger.error('🔍 DIAGNOSIS: 403 Forbidden error suggests:');
        logger.error('   1. API key may lack ranked data permissions');
        logger.error('   2. API key may be for a different region/product');
        logger.error('   3. API key may have expired or been revoked');
        logger.error('💡 SOLUTION: Generate a new API key at https://developer.riotgames.com/');
        logger.error('             Make sure to select League of Legends product');
      }
      
      throw error;
    }
  }// Validate API key with comprehensive testing
  async validateApiKey(): Promise<boolean> {
    try {
      logger.info('Starting comprehensive API key validation...');
      
      // Test 1: Platform status (doesn't require authentication)
      try {
        const statusUrl = `${this.baseUrls['na1']}/lol/status/v4/platform-data`;
        logger.info(`Testing platform status: ${statusUrl}`);
        await this.makeRequest(statusUrl);
        logger.info('✅ Platform status endpoint: SUCCESS');
      } catch (error: any) {
        logger.error('❌ Platform status endpoint: FAILED', error.message);
      }

      // Test 2: Summoner by name (requires authentication)
      try {
        const summonerUrl = `${this.baseUrls['na1']}/lol/summoner/v4/summoners/by-name/test`;
        logger.info(`Testing summoner endpoint: ${summonerUrl}`);
        await this.makeRequest(summonerUrl);
        logger.info('✅ Summoner endpoint: SUCCESS (or expected 404)');
      } catch (error: any) {
        if (error.message.includes('not found')) {
          logger.info('✅ Summoner endpoint: SUCCESS (expected 404 for test summoner)');
        } else {
          logger.error('❌ Summoner endpoint: FAILED', error.message);
          throw error;
        }
      }      // Test 3: Champion rotations (simpler endpoint that doesn't require specific IDs)
      try {
        const championUrl = `${this.baseUrls['na1']}/lol/platform/v3/champion-rotations`;
        logger.info(`Testing champion rotations endpoint: ${championUrl}`);
        await this.makeRequest(championUrl);
        logger.info('✅ Champion rotations endpoint: SUCCESS');
      } catch (error: any) {
        logger.error('❌ Champion rotations endpoint: FAILED', error.message);
        throw error;
      }

      logger.info('✅ All API key validations passed');
      return true;
    } catch (error: any) {
      logger.error('❌ API key validation failed:', error.message);
      return false;
    }
  }

  // Get available regions
  getAvailableRegions(): string[] {
    return Object.keys(this.baseUrls);
  }

  async getSummonerByRiotId(region: string, gameName: string, tagLine: string): Promise<SummonerData> {
    if (!this.apiKey) {
      throw new Error('Riot API key not configured');
    }

    const cluster = this.getRegionalCluster(region);
    const clusterUrl = this.getClusterUrl(cluster);

    // First get the account data using Riot ID
    const accountUrl = `${clusterUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    
    logger.info(`Fetching account data for ${gameName}#${tagLine} in cluster ${cluster}`);
    logger.info(`Using account URL: ${accountUrl}`);
    
    const accountData = await this.makeRequest(accountUrl);
    
    // Then get summoner data using the puuid
    const baseUrl = this.baseUrls[region];
    const summonerUrl = `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}`;
    
    logger.info(`Fetching summoner data for puuid ${accountData.puuid} in ${region}`);
    logger.info(`Using summoner URL: ${summonerUrl}`);
    
    return await this.makeRequest(summonerUrl);
  }
}

export default new RiotAPIService();
