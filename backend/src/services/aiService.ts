import axios from 'axios';
import logger from '../utils/logger';
import EnhancedDataProcessor from './enhancedDataProcessor';

interface AIAnalysisRequest {
  summonerData: any;
  matchData: any[];
  rankedData: any[];
  analysisType: 'performance' | 'improvement' | 'champion_recommendation' | 'coaching';
}

interface AIAnalysisResponse {
  analysis: string;
  insights: string[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  score: number;
  timestamp: string;
}

class AIService {
  private apiKey: string;
  private apiProvider: string;
  private model: string;
  private baseUrl: string;  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.apiProvider = process.env.AI_API_PROVIDER || 'groq';
    this.model = process.env.AI_MODEL || 'llama-3.1-8b-instant';
    
    logger.info(`AI Service initialized with provider: ${this.apiProvider}, model: ${this.model}`);
    
    // Configure base URL based on provider
    if (this.apiProvider === 'groq') {
      this.baseUrl = 'https://api.groq.com/openai/v1';
    } else {
      this.baseUrl = 'https://api.openai.com/v1';
    }

    if (!this.apiKey) {
      logger.warn('AI API key not provided. AI features will not work.');
    } else {
      logger.info('AI API key found and configured');
    }
  }
  private async makeAIRequest(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [            {              role: 'system',
              content: `You are an expert League of Legends coach and analyst. Provide detailed, actionable insights based on player data. Be specific, constructive, and focus on improvement. Use gaming terminology and be encouraging but honest about areas for improvement.

FORMATTING INSTRUCTIONS:
- Use clean markdown formatting (bold with **, lists with -, etc.)
- DO NOT use ## headers - the system will add those automatically
- Use bullet points (-) for lists and recommendations
- Use **bold text** for emphasis
- Include emojis for visual appeal but don't overuse them
- Avoid HTML tags and inline styles - use only markdown
- Make text readable and well-organized
- Focus on content, not headers - headers will be added automatically`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from AI API');
      }

      return response.data.choices[0].message.content;
    } catch (error: any) {
      logger.error('AI API request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        model: this.model,
        provider: this.apiProvider
      });
      
      if (error.response?.status === 401) {
        throw new Error('Invalid AI API key or authentication failed');
      } else if (error.response?.status === 400) {
        throw new Error(`Bad request to AI API: ${error.response?.data?.error?.message || 'Unknown error'}`);
      } else if (error.response?.status === 429) {
        throw new Error('AI API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Failed to generate AI analysis: ${error.message}`);
      }
    }
  }

  async analyzePlayerPerformance(data: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const { summonerData, matchData, rankedData } = data;

    // Create comprehensive prompt
    const prompt = this.createPerformancePrompt(summonerData, matchData, rankedData);
    
    logger.info('Generating AI performance analysis...');
    const aiResponse = await this.makeAIRequest(prompt);
    
    // Parse AI response into structured format
    return this.parseAIResponse(aiResponse, 'performance');
  }

  async generateCoachingInsights(data: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const { summonerData, matchData, rankedData } = data;

    const prompt = this.createCoachingPrompt(summonerData, matchData, rankedData);
    
    logger.info('Generating AI coaching insights...');
    const aiResponse = await this.makeAIRequest(prompt);
    
    return this.parseAIResponse(aiResponse, 'coaching');
  }

  async recommendChampions(data: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const { summonerData, matchData, rankedData } = data;

    const prompt = this.createChampionRecommendationPrompt(summonerData, matchData, rankedData);
    
    logger.info('Generating champion recommendations...');
    const aiResponse = await this.makeAIRequest(prompt);
    
    return this.parseAIResponse(aiResponse, 'champion_recommendation');
  }  private createPerformancePrompt(summonerData: any, matchData: any[], rankedData: any[]): string {
    // Enriquecer datos con métricas avanzadas
    const enhancedMatches = EnhancedDataProcessor.enhanceMatchData(matchData);
    const enhancedSummary = EnhancedDataProcessor.generateEnhancedSummary(enhancedMatches);
    const metaAnalysis = EnhancedDataProcessor.generateMetaAnalysis(enhancedMatches, rankedData);
    
    // Ensure trends object exists with fallback
    if (!enhancedSummary.trends) {
      enhancedSummary.trends = {
        strongestPhase: 'Mid Game',
        consistencyRating: 5.0,
        preferredGameLength: 'Standard games',
        difficultyTolerance: 5.0
      };
    }
    
    const rankedInfo = rankedData.map(rank => 
      `${rank.queueType}: ${rank.tier} ${rank.rank} (${rank.leaguePoints} LP) - ${rank.wins}W/${rank.losses}L`
    ).join(', ');

    const recentMatches = enhancedMatches.slice(0, 10).map(match => {
      const player = match.player;
      const metrics = match.enhancedMetrics;
      const gameDuration = match.info?.gameDuration || match.gameDuration || 1800;
      const durationMinutes = Math.round(gameDuration / 60);
      
      return `${player.championName} (${metrics?.championTier} tier): ${player.kills}/${player.deaths}/${player.assists} (${player.win ? 'W' : 'L'}) - ${Math.round(player.totalDamageDealtToChampions/1000)}k dmg, ${player.totalMinionsKilled} CS in ${durationMinutes}min
   └─ Performance: ${metrics?.performanceScore}/10, Meta Score: ${metrics?.metaScore}/10, Optimal Build: ${metrics?.optimalBuild ? 'Yes' : 'No'}, CS vs Meta: ${metrics?.metaComparison?.csVsMeta}%`;
    }).join('\n');    // Calculate basic metrics with enhanced data
    const avgKDA = this.calculateAverageKDA(matchData);
    const winRate = (matchData.filter(m => m.player?.win).length / Math.min(matchData.length, 20) * 100).toFixed(1);
    const avgCS = enhancedSummary?.avgMetrics?.csPerMinute || 0;
    const avgDamage = Math.round((enhancedSummary?.avgMetrics?.damagePerMinute || 0) / 1000);// Meta context
    const metaContext = metaAnalysis.metaContext;
    const championMetaInfo = metaAnalysis.championAnalysis
      .filter((c: any) => c && c.metaAnalysis && c.metaAnalysis.comparisons) // Filter out undefined items
      .map((c: any) => 
        `${c.champion}: ${c.metaAnalysis.tier} tier (${c.metaAnalysis.winRate}% meta WR) - Your performance vs meta: KDA ${c.metaAnalysis.comparisons.kdaVsMeta || 100}%, CS ${c.metaAnalysis.comparisons.csVsMeta || 100}%`
      ).join('\n') || 'No champion meta data available';

    return `
ENHANCED PERFORMANCE METRICS ANALYSIS WITH META CONTEXT - Focus on detailed statistics and meta positioning:

CURRENT META CONTEXT (Patch ${metaContext?.currentPatch}):
- Strong Roles: ${metaContext?.strongRoles.join(', ')}
- Emerging Picks: ${metaContext?.emergingPicks.join(', ')}
- Recent Buffs: ${metaContext?.buffedChampions.join(', ')}
- Recent Nerfs: ${metaContext?.nerfedChampions.join(', ')}

PLAYER STATS:
- Level: ${summonerData.level}
- Ranks: ${rankedInfo}
- Win Rate (last ${Math.min(matchData.length, 20)} games): ${winRate}%
- Average KDA: ${avgKDA.kills}/${avgKDA.deaths}/${avgKDA.assists}
- Overall Meta Adaptation Score: ${metaAnalysis.overallMetaScore}/10

CHAMPION POOL META ANALYSIS:
${championMetaInfo}

ENHANCED PERFORMANCE METRICS:
- CS per Minute: ${avgCS} (Industry Standard: 6.5+ for Emerald)
- Damage per Minute: ${Math.round(enhancedSummary.avgMetrics.damagePerMinute)}
- Vision Score per Minute: ${enhancedSummary.avgMetrics.visionPerMinute}
- Kill Participation: ${Math.round(enhancedSummary.avgMetrics.killParticipation * 100)}%
- Gold Efficiency: ${enhancedSummary.avgMetrics.goldEfficiency}

PERFORMANCE BY GAME PHASE:
- Early Game Performance (0-20min): ${enhancedSummary.avgMetrics.earlyGameScore}/10
- Mid Game Performance (20-35min): ${enhancedSummary.avgMetrics.midGameScore}/10  
- Late Game Performance (35min+): ${enhancedSummary.avgMetrics.lateGameScore}/10
- Strongest Phase: ${enhancedSummary.trends.strongestPhase}

CONSISTENCY & PATTERNS:
- Performance Consistency: ${enhancedSummary.trends.consistencyRating}/10
- Preferred Game Length: ${enhancedSummary.trends.preferredGameLength}
- Average Match Difficulty: ${enhancedSummary.avgMetrics.avgDifficulty}/10
- Difficulty Tolerance: ${enhancedSummary.trends.difficultyTolerance}

RECENT MATCHES ANALYSIS WITH META CONTEXT (Last 10):
${recentMatches}

ANALYSIS REQUIREMENTS:
Provide ONLY numerical performance analysis with META-AWARE focus on:

1. **Overall Performance Score** (1-10) with detailed breakdown including meta adaptation
2. **Meta Positioning Analysis**: How well player adapts to current meta vs playing off-meta picks
3. **Champion Pool Effectiveness**: Performance comparison of played champions vs their meta standing
4. **Build Optimization**: Usage of optimal builds vs suboptimal itemization
5. **Phase Analysis**: Strength/weakness by game phase with meta context
6. **Efficiency Metrics**: CS/min, Damage efficiency compared to meta benchmarks for each champion
7. **Meta Trend Adaptation**: How performance aligns with current patch strengths

USE THESE ENHANCED METRICS + META CONTEXT for more accurate analysis. Focus on:
- Performance relative to champion's meta tier and expected performance
- Build optimization and meta adaptation
- Champion tier effectiveness vs player performance
- Meta-aware benchmarking and comparisons

DO NOT INCLUDE:
- Coaching tips or improvement advice
- Champion recommendations  
- General gameplay suggestions

Focus purely on enhanced statistical analysis and performance scoring using detailed metrics AND meta positioning.
`;
  }
  private createCoachingPrompt(summonerData: any, matchData: any[], rankedData: any[]): string {
    const avgKDA = this.calculateAverageKDA(matchData);
    const winRate = this.calculateWinRate(matchData);
    const commonChampions = this.getCommonChampions(matchData);    // Analyze recent performance patterns
    const recentGames = matchData.slice(0, 20);
    const deathPatterns = recentGames.map(game => game.player?.deaths || 0).join(', ');

    return `
COACHING GUIDANCE ONLY - Provide actionable improvement strategies:

PLAYER CONTEXT:
- Level: ${summonerData.level}
- Win Rate: ${winRate}%
- Average KDA: ${avgKDA.kills}/${avgKDA.deaths}/${avgKDA.assists}
- Main Champions: ${commonChampions.slice(0, 3).join(', ')}
- Deaths last 20 games: ${deathPatterns}

COACHING REQUIREMENTS:
Provide ONLY actionable coaching advice:

1. **Top 3 Priority Areas** to focus on this week
2. **Daily Practice Drills** (specific exercises with time commitments):
   - 15-30 minute focused practice sessions
   - Specific mechanics to drill
3. **Weekly Improvement Plan**:
   - Week 1 goals and focus areas
   - Week 2-3 progression targets
4. **Situational Advice** for common gameplay scenarios:
   - When ahead: specific macro plays
   - When behind: comeback strategies
   - Teamfight positioning tips
5. **Habit Building** recommendations for consistent improvement

DO NOT INCLUDE:
- Performance scores or statistical analysis
- Champion recommendations or meta discussions
- General analysis without actionable steps

Focus on step-by-step improvement plans, practice routines, and specific coaching drills.
`;
  }  private createChampionRecommendationPrompt(summonerData: any, matchData: any[], rankedData: any[]): string {
    const playedChampions = this.getChampionPerformance(matchData);
    const currentRank = rankedData[0]?.tier || 'Unranked';
    const winRate = this.calculateWinRate(matchData);

    // Enhanced analysis with meta context
    const enhancedMatches = EnhancedDataProcessor.enhanceMatchData(matchData);
    const metaAnalysis = EnhancedDataProcessor.generateMetaAnalysis(enhancedMatches, rankedData);
    const champStats = this.getDetailedChampionStats(matchData);    // Meta context information
    const metaContext = metaAnalysis.metaContext;
    const recommendationsData = metaAnalysis.recommendations;
    
    // Safely handle recommendations with fallbacks
    const currentPoolMeta = metaAnalysis.championAnalysis?.map((c: any) => 
      `${c.champion} (${c.gamesPlayed} games): ${c.metaAnalysis?.tier || 'C'} tier | Meta WR: ${c.metaAnalysis?.winRate || 50}% | Your performance vs meta: KDA ${c.metaAnalysis?.comparisons?.kdaVsMeta || 100}%, CS ${c.metaAnalysis?.comparisons?.csVsMeta || 100}% | Optimal builds used: ${Math.round(c.optimalBuildUsage || 0)}%`
    ).join('\n') || 'No champion data available';

    // Access nested recommendations correctly
    const recommendations = recommendationsData?.recommendations || { strengthenPool: [], maintainFocus: [], considerReplacing: [] };
    
    const topMetaRecommendations = recommendations.strengthenPool?.map((r: any) => 
      `${r.champion}: ${r.tier} tier (${r.winRate}% WR) - ${r.reason}`
    ).join('\n') || 'No recommendations available';

    const maintainChampions = recommendations.maintainFocus?.map((r: any) => 
      `${r.champion}: ${r.tier} tier - ${r.reason}`
    ).join('\n') || 'None';

    const replaceChampions = recommendations.considerReplacing?.map((r: any) => 
      `${r.champion}: ${r.tier} tier - ${r.reason}`
    ).join('\n') || 'None';

    return `
CHAMPION POOL META ANALYSIS - Current Patch ${metaContext?.currentPatch} Focus:

CURRENT META CONTEXT:
- Strong Roles: ${metaContext?.strongRoles.join(', ')}
- Trending Picks: ${metaContext?.emergingPicks.join(', ')}
- Recent Buffs: ${metaContext?.buffedChampions.join(', ')}
- Recent Nerfs: ${metaContext?.nerfedChampions.join(', ')}
- Meta Shifts: ${metaContext?.metaShifts.join(' | ')}

CURRENT CHAMPION POOL META ANALYSIS:
${currentPoolMeta}

CHAMPION POOL META SCORE: ${metaAnalysis.overallMetaScore}/10

TRADITIONAL CHAMPION STATS:
${champStats}

PLAYER CONTEXT:
- Current Rank: ${currentRank} ${rankedData[0]?.rank || ''}
- Overall Win Rate: ${winRate}%
- Games Analyzed: ${matchData.length}
- Meta Adaptation Score: ${metaAnalysis.overallMetaScore}/10

META-INFORMED RECOMMENDATIONS:

STRENGTHEN POOL (Add these meta picks):
${topMetaRecommendations}

MAINTAIN FOCUS (Keep playing):
${maintainChampions}

CONSIDER REPLACING (Below meta threshold):
${replaceChampions}

CHAMPION ANALYSIS REQUIREMENTS:
Provide ONLY champion pool and META-AWARE analysis:

1. **Current Pool Meta Effectiveness** (1-10) based on patch ${metaContext?.currentPatch} tier standings
2. **Individual Champion Meta Standing**:
   - Current tier position and meta viability
   - Win rate in current meta vs your performance
   - Build optimization scores
3. **Meta Tier List for ${currentRank}** with patch context:
   - S+ tier must-picks for current patch
   - S/A tier stable picks
   - Emerging meta champions to consider
4. **Meta-Informed Champion Recommendations**:
   - Champions that got recent buffs and fit your playstyle
   - Meta-stable champions for consistent performance
   - Counter-picks for common meta champions
5. **Champion Pool Meta Gaps**:
   - Missing S/A tier options in your roles
   - Lack of meta-buffed champions
   - Build optimization opportunities

USE META CONTEXT: Consider patch ${metaContext?.currentPatch} changes, recent buffs/nerfs, and current tier standings.

DO NOT INCLUDE:
- General gameplay tips or mechanics advice
- Performance metrics or statistical breakdowns
- Coaching recommendations

Focus purely on META-INFORMED champion selection, tier positioning, and pool optimization with patch-specific context.
`;  }
  
  private parseAIResponse(aiResponse: string, analysisType: string): AIAnalysisResponse {
    // Extract structured information from AI response
    const insights = this.extractBulletPoints(aiResponse, ['insights', 'key points', 'observations']);
    const recommendations = this.extractBulletPoints(aiResponse, ['recommendations', 'suggestions', 'advice']);
    const strengths = this.extractBulletPoints(aiResponse, ['strengths', 'good', 'positive', 'above']);
    const weaknesses = this.extractBulletPoints(aiResponse, ['weaknesses', 'improve', 'issues', 'problems', 'below', 'concern']);
    
    // Extract numerical score if present - look for multiple patterns
    let score = 7.5; // default
    
    // Try different score patterns in order of specificity
    const scorePatterns = [
      // Most specific patterns first - for **Overall Performance Score: 7.5/10**
      /\*\*Overall Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\/10\*\*/i,
      /\*\*Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\/10\*\*/i,
      // Pattern for **Overall Performance Score: 7.5**
      /\*\*Overall Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\*\*/i,
      /\*\*Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\*\*/i,
      // General patterns without bold markdown
      /Overall Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\/10/i,
      /Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\/10/i,
      /Overall Performance Score[^:]*:\s*(\d+(?:\.\d+)?)/i,
      /Performance Score[^:]*:\s*(\d+(?:\.\d+)?)/i,
      // Generic fallback patterns
      /(\d+(?:\.\d+)?)\s*\/\s*10/i,
      /(\d+(?:\.\d+)?)\s*out of\s*10/i
    ];
    
    for (let i = 0; i < scorePatterns.length; i++) {
      const pattern = scorePatterns[i];
      const match = aiResponse.match(pattern);
      if (match) {
        const parsedScore = parseFloat(match[1]);
        if (parsedScore >= 0 && parsedScore <= 10) {
          score = parsedScore;
          logger.info(`Score extracted using pattern ${i}: ${score} from "${match[0]}"`);
          break;
        }
      }
    }

    // Format the analysis text for better readability
    const formattedAnalysis = this.formatAIResponse(aiResponse, analysisType);

    return {
      analysis: formattedAnalysis,
      insights,
      recommendations,
      strengths,
      weaknesses,
      score,
      timestamp: new Date().toISOString()
    };
  }
  private extractBulletPoints(text: string, keywords: string[]): string[] {
    const lines = text.split('\n');
    const bulletPoints: string[] = [];
    let inRelevantSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if we're entering a relevant section based on keywords
      const isKeywordLine = keywords.some(keyword => 
        trimmed.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (isKeywordLine && (trimmed.includes(':') || trimmed.includes('**'))) {
        inRelevantSection = true;
        continue;
      }
      
      // If we hit another section header, stop collecting
      if (trimmed.match(/^\*\*[^*]+\*\*:?\s*$/) && !isKeywordLine) {
        inRelevantSection = false;
      }
      
      // Extract bullet points when in relevant section
      if (inRelevantSection && (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/))) {
        const cleaned = trimmed.replace(/^[-•*]\s+|^\d+\.\s+/, '').trim();
        if (cleaned.length > 10) {
          bulletPoints.push(cleaned);
        }
      }
      
      // Also extract any bullet point that contains keywords directly
      if (!inRelevantSection && (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/))) {
        const cleaned = trimmed.replace(/^[-•*]\s+|^\d+\.\s+/, '').trim();
        const containsKeyword = keywords.some(keyword => 
          cleaned.toLowerCase().includes(keyword.toLowerCase())
        );
        if (containsKeyword && cleaned.length > 10) {
          bulletPoints.push(cleaned);
        }
      }
    }
    
    return bulletPoints.slice(0, 8); // Limit to 8 points
  }
  private calculateAverageKDA(matchData: any[]): { kills: number; deaths: number; assists: number } {
    if (matchData.length === 0) return { kills: 0, deaths: 0, assists: 0 };

    const totals = matchData.reduce((acc, match) => ({
      kills: acc.kills + (match.player?.kills || 0),
      deaths: acc.deaths + (match.player?.deaths || 0),
      assists: acc.assists + (match.player?.assists || 0)
    }), { kills: 0, deaths: 0, assists: 0 });

    return {
      kills: Math.round((totals.kills / matchData.length) * 10) / 10,
      deaths: Math.round((totals.deaths / matchData.length) * 10) / 10,
      assists: Math.round((totals.assists / matchData.length) * 10) / 10
    };
  }
  private calculateWinRate(matchData: any[]): number {
    if (matchData.length === 0) return 0;
    const wins = matchData.filter(match => match.player?.win).length;
    return Math.round((wins / matchData.length) * 100);
  }
  private getCommonChampions(matchData: any[]): string[] {
    const championCounts: { [key: string]: number } = {};
    
    matchData.forEach(match => {
      const champion = match.player?.championName;
      if (champion) {
        championCounts[champion] = (championCounts[champion] || 0) + 1;
      }
    });

    return Object.entries(championCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([champion]) => champion);
  }
  private getChampionPerformance(matchData: any[]): string {
    const performance: { [key: string]: { wins: number; losses: number; avgKDA: number; kdaCount: number } } = {};
    
    matchData.forEach(match => {
      const champion = match.player?.championName;
      const player = match.player;
      
      if (!champion || !player) return;
      
      if (!performance[champion]) {
        performance[champion] = { wins: 0, losses: 0, avgKDA: 0, kdaCount: 0 };
      }
      
      if (player.win) {
        performance[champion].wins++;
      } else {
        performance[champion].losses++;
      }
      
      const kills = player.kills || 0;
      const deaths = player.deaths || 0;
      const assists = player.assists || 0;
      const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
      
      performance[champion].avgKDA = (performance[champion].avgKDA * performance[champion].kdaCount + kda) / (performance[champion].kdaCount + 1);
      performance[champion].kdaCount++;
    });

    return Object.entries(performance)
      .map(([champion, stats]) => 
        `${champion}: ${stats.wins}W/${stats.losses}L (${stats.avgKDA.toFixed(1)} KDA)`
      )
      .join('\n');
  }
  private getDetailedChampionStats(matchData: any[]): string {
    const championMap = new Map();
    
    matchData.forEach(match => {
      const champName = match.player?.championName;
      if (!champName) return;
      
      if (!championMap.has(champName)) {
        championMap.set(champName, {
          games: 0,
          wins: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          totalDamage: 0,
          totalCS: 0
        });
      }
      
      const stats = championMap.get(champName);
      const player = match.player;
      
      stats.games += 1;
      stats.wins += player?.win ? 1 : 0;
      stats.totalKills += player?.kills || 0;
      stats.totalDeaths += player?.deaths || 0;
      stats.totalAssists += player?.assists || 0;
      stats.totalDamage += player?.totalDamageDealtToChampions || 0;
      stats.totalCS += player?.totalMinionsKilled || 0;
    });

    const champStatsArray = Array.from(championMap.entries()).map(([name, stats]) => {
      const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;
      const avgKDA = `${(stats.totalKills / stats.games).toFixed(1)}/${(stats.totalDeaths / stats.games).toFixed(1)}/${(stats.totalAssists / stats.games).toFixed(1)}`;
      const avgDamage = stats.games > 0 ? Math.round(stats.totalDamage / stats.games / 1000) : 0;
      const avgCS = stats.games > 0 ? Math.round(stats.totalCS / stats.games) : 0;
      
      return `${name}: ${stats.games} games, ${winRate}% WR, ${avgKDA} KDA, ${avgDamage}k dmg, ${avgCS} CS`;
    });

    return champStatsArray.join('\n');
  }

  // Validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      await this.makeAIRequest('Test message');
      return true;
    } catch (error) {
      logger.error('AI API key validation failed:', error);
      return false;
    }
  }  private formatAIResponse(rawResponse: string, analysisType: string): string {
    try {
      let formatted = rawResponse;

      // STEP 1: Remove any HTML tags and convert to clean markdown
      formatted = formatted.replace(/<[^>]*>/g, ''); // Remove all HTML tags
      formatted = formatted.replace(/&nbsp;/g, ' '); // Replace HTML entities
      formatted = formatted.replace(/&amp;/g, '&');
      formatted = formatted.replace(/&lt;/g, '<');
      formatted = formatted.replace(/&gt;/g, '>');

      // STEP 1.5: Clean up any double ## headers that might have been created by AI
      formatted = formatted.replace(/##\s*##\s*/g, '## ');
      formatted = formatted.replace(/###\s*##\s*/g, '## ');

      // STEP 2: Format main score headers with clean markdown
      formatted = formatted.replace(
        /\*\*Overall Performance Score.*?(\d+(?:\.\d+)?)\/10\*\*/gi,
        '## 🎯 Overall Performance Score: $1/10\n'
      );

      formatted = formatted.replace(
        /\*\*Current Pool Meta Effectiveness.*?(\d+(?:\.\d+)?)\/10\*\*/gi,
        '## 📊 Current Pool Meta Effectiveness: $1/10\n'
      );

      // STEP 3: Format numbered section headers
      formatted = formatted.replace(
        /(\d+)\.\s*\*\*([^*]+)\*\*/g,
        '## $1. $2\n'
      );

      // STEP 4: Format specific analysis section headers with emojis
      const sectionMappings = [
        { pattern: /\*\*(Performance by Game Phase)\*\*/g, replacement: '## 📊 $1\n' },
        { pattern: /\*\*(Consistency & Patterns)\*\*/g, replacement: '## 📈 $1\n' },
        { pattern: /\*\*(Enhanced Performance Metrics)\*\*/g, replacement: '## 📋 $1\n' },
        { pattern: /\*\*(Meta Tier List)\*\*/g, replacement: '## 🏆 $1\n' },
        { pattern: /\*\*(Champion Pool Meta Gaps)\*\*/g, replacement: '## ⚠️ $1\n' },
        { pattern: /\*\*(Individual Champion Meta Standing)\*\*/g, replacement: '## 🔍 $1\n' },
        { pattern: /\*\*(Meta-Informed Champion Recommendations)\*\*/g, replacement: '## 🧠 $1\n' },
        { pattern: /\*\*(Performance Analysis)\*\*/g, replacement: '## 📊 $1\n' },
        { pattern: /\*\*(Meta Analysis)\*\*/g, replacement: '## 🌍 $1\n' },
        { pattern: /\*\*(Recommendations)\*\*/g, replacement: '## 💡 $1\n' }
      ];

      sectionMappings.forEach(({ pattern, replacement }) => {
        formatted = formatted.replace(pattern, replacement);
      });

      // STEP 5: Format subsection headers with dashes
      formatted = formatted.replace(
        /-\s*\*\*([^*:]+)\*\*:/g,
        '### ➤ $1:\n'
      );

      // STEP 6: Format specific coaching and champion recommendation sections
      if (analysisType === 'coaching') {
        formatted = this.formatCoachingSectionMarkdown(formatted);
      }

      if (analysisType === 'champion_recommendation') {
        formatted = this.formatChampionRecommendationsMarkdown(formatted);
      }

      // STEP 7: Ensure bullet points are properly formatted
      formatted = formatted.replace(/^[\s]*[-•*]\s+/gm, '- ');
      formatted = formatted.replace(/^[\s]*(\d+)\.\s+/gm, '$1. ');

      // STEP 8: Format scores with emojis but keep them as clean markdown
      formatted = formatted.replace(
        /(\d+(?:\.\d+)?)\/10/g,
        (match, score) => {
          const numScore = parseFloat(score);
          const emoji = numScore >= 8 ? '🟢' : numScore >= 6 ? '🟡' : '🔴';
          return `${emoji} **${score}/10**`;
        }
      );

      // STEP 9: Clean up spacing and ensure consistent markdown formatting
      formatted = formatted.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
      formatted = formatted.replace(/\n\s*\n/g, '\n\n'); // Clean up whitespace between lines
      formatted = formatted.replace(/^\s+|\s+$/g, ''); // Trim start and end
      
      // STEP 10: Ensure no inline styles or HTML remnants
      formatted = formatted.replace(/style\s*=\s*"[^"]*"/gi, ''); // Remove style attributes
      formatted = formatted.replace(/class\s*=\s*"[^"]*"/gi, ''); // Remove class attributes

      return formatted;
    } catch (error) {
      logger.error('Error formatting AI response:', error);
      return rawResponse;
    }
  }
private formatCoachingSectionMarkdown(text: string): string {
    // Format coaching specific sections with proper markdown structure
    text = text.replace(
      /\*\*Top 3 Priority Areas\*\*/g,
      '## 🎯 Priority Focus Areas\n'
    );

    text = text.replace(
      /\*\*Daily Practice Drills\*\*/g,
      '## ⏰ Daily Practice Routine\n'
    );

    text = text.replace(
      /\*\*Weekly Improvement Plan\*\*/g,
      '## 📅 Weekly Development Plan\n'
    );

    text = text.replace(
      /\*\*Situational Advice\*\*/g,
      '## 🎮 Situational Strategies\n'
    );

    text = text.replace(
      /\*\*Habit Building\*\*/g,
      '## 🏗️ Building Better Habits\n'
    );

    // Format coaching subsections without asterisks as fallback
    text = text.replace(
      /Top 3 Priority Areas/g,
      '## 🎯 Priority Focus Areas\n'
    );

    text = text.replace(
      /Daily Practice Drills/g,
      '## ⏰ Daily Practice Routine\n'
    );

    text = text.replace(
      /Weekly Improvement Plan/g,
      '## 📅 Weekly Development Plan\n'
    );

    text = text.replace(
      /Situational Advice/g,
      '## 🎮 Situational Strategies\n'
    );

    text = text.replace(
      /Habit Building/g,
      '## 🏗️ Building Better Habits\n'
    );

    // Format coaching subsections
    text = text.replace(
      /\*\*Immediate Actions\*\*/g,
      '### ⚡ Immediate Actions\n'
    );

    text = text.replace(
      /Immediate Actions/g,
      '### ⚡ Immediate Actions\n'
    );

    text = text.replace(
      /\*\*Long-term Development\*\*/g,
      '### 🎯 Long-term Development\n'
    );

    text = text.replace(
      /Long-term Development/g,
      '### 🎯 Long-term Development\n'
    );

    text = text.replace(
      /\*\*Mindset & Mental Game\*\*/g,
      '### 🧠 Mindset & Mental Game\n'
    );

    text = text.replace(
      /Mindset & Mental Game/g,
      '### 🧠 Mindset & Mental Game\n'
    );

    // Format practice drill items with better structure
    text = text.replace(
      /Practice drill:\s*([^.]+)/gi,
      '**🎯 Practice Drill:** $1\n'
    );

    text = text.replace(
      /Time commitment:\s*([^.]+)/gi,
      '**⏱️ Time:** $1\n'
    );

    return text;
  }

  private formatChampionRecommendationsMarkdown(text: string): string {
    // Format champion recommendation specific sections with markdown
    
    // Format main sections with asterisks first
    text = text.replace(
      /\*\*STRENGTHEN POOL \(Add these meta picks\):\*\*/g,
      '## 📈 Strengthen Your Pool\n**🆕 Recommended Meta Additions:**\n'
    );

    text = text.replace(
      /\*\*MAINTAIN FOCUS \(Keep playing\):\*\*/g,
      '## ✅ Keep Playing\n**🎯 Maintain Focus On:**\n'
    );

    text = text.replace(
      /\*\*CONSIDER REPLACING \(Below meta threshold\):\*\*/g,
      '## ⚠️ Consider Replacing\n**📉 Below Meta Threshold:**\n'
    );

    text = text.replace(
      /\*\*CURRENT META CONTEXT:\*\*/g,
      '## 🌍 Current Meta Context\n'
    );

    text = text.replace(
      /\*\*CURRENT CHAMPION POOL META ANALYSIS:\*\*/g,
      '## 🏆 Your Champion Pool Analysis\n'
    );

    text = text.replace(
      /\*\*META-INFORMED RECOMMENDATIONS:\*\*/g,
      '## 🧠 Meta-Informed Recommendations\n'
    );

    // Format sections without asterisks as fallback
    text = text.replace(
      /STRENGTHEN POOL \(Add these meta picks\):/g,
      '## 📈 Strengthen Your Pool\n**🆕 Recommended Meta Additions:**\n'
    );

    text = text.replace(
      /MAINTAIN FOCUS \(Keep playing\):/g,
      '## ✅ Keep Playing\n**🎯 Maintain Focus On:**\n'
    );

    text = text.replace(
      /CONSIDER REPLACING \(Below meta threshold\):/g,
      '## ⚠️ Consider Replacing\n**📉 Below Meta Threshold:**\n'
    );

    text = text.replace(
      /CURRENT META CONTEXT:/g,
      '## 🌍 Current Meta Context\n'
    );

    text = text.replace(
      /CURRENT CHAMPION POOL META ANALYSIS:/g,
      '## 🏆 Your Champion Pool Analysis\n'
    );

    text = text.replace(
      /META-INFORMED RECOMMENDATIONS:/g,
      '## 🧠 Meta-Informed Recommendations\n'
    );

    // Format subsections with enhanced styling - convert to markdown lists
    text = text.replace(
      /- Strong Roles:/g,
      '- **🟢 Strong Roles:**'
    );

    text = text.replace(
      /- Trending Picks:/g,
      '- **🔥 Trending Picks:**'
    );

    text = text.replace(
      /- Recent Buffs:/g,
      '- **⬆️ Recent Buffs:**'
    );

    text = text.replace(
      /- Recent Nerfs:/g,
      '- **⬇️ Recent Nerfs:**'
    );

    return text;
  }
}

export default new AIService();
