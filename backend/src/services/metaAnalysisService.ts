import axios from 'axios';
import logger from '../utils/logger';

// Interfaces para datos del meta
interface ChampionMetaData {
  championId: number;
  championName: string;
  tier: 'S+' | 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  winRate: number;
  pickRate: number;
  banRate: number;
  averageKDA: number;
  averageCS: number;
  averageDamage: number;
  roles: string[];
  difficulty: number; // 1-10
  counters: string[]; // Campeones que lo counteren
  strongAgainst: string[]; // Campeones contra los que es fuerte
}

interface OptimalBuild {
  championName: string;
  role: string;
  winRate: number;
  sampleSize: number;
  items: {
    core: number[]; // IDs de items core
    boots: number[];
    situational: number[];
  };
  runes: {
    primary: string;
    secondary: string;
    keystone: string;
  };
  startingItems: number[];
  skillOrder: string; // "Q>W>E", etc.
}

interface MetaContext {
  currentPatch: string;
  patchDate: string;
  majorChanges: string[];
  metaShifts: string[];
  strongRoles: string[]; // Roles más influyentes en el meta actual
  emergingPicks: string[]; // Campeones emergentes
  nerfedChampions: string[]; // Campeones nerfeados recientemente
  buffedChampions: string[]; // Campeones buffeados recientemente
}

class MetaAnalysisService {
  private champions: Map<string, ChampionMetaData> = new Map();
  private builds: Map<string, OptimalBuild[]> = new Map();
  private metaContext: MetaContext | null = null;
  private lastUpdate: Date | null = null;
  private updateInterval = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    this.initializeMetaData();
  }

  /**
   * Inicializa los datos del meta con información estática actualizada
   * En producción esto se podría conectar a APIs como Riot DataDragon, OP.GG, etc.
   */
  private async initializeMetaData() {
    try {
      logger.info('Initializing meta analysis data...');
      
      // Por ahora usamos datos estáticos del meta actual (Patch 14.23)
      this.metaContext = this.getCurrentMetaContext();
      this.champions = this.loadChampionMetaData();
      this.builds = this.loadOptimalBuilds();
      this.lastUpdate = new Date();
      
      logger.info(`Meta data initialized for patch ${this.metaContext.currentPatch}`);
    } catch (error) {
      logger.error('Error initializing meta data:', error);
    }
  }

  /**
   * Obtiene el contexto del meta actual
   */
  private getCurrentMetaContext(): MetaContext {
    return {
      currentPatch: "14.23",
      patchDate: "2024-11-20",
      majorChanges: [
        "ADC item rework - Kraken Slayer changes",
        "Jungle experience adjustments",
        "Support item buffs",
        "Tank itemization updates"
      ],
      metaShifts: [
        "ADC meta favors crit builds over on-hit",
        "Jungle power farming more viable",
        "Support roaming increased",
        "Tank supports rising in priority"
      ],
      strongRoles: ["ADC", "Support", "Jungle"],
      emergingPicks: ["Jinx", "Caitlyn", "Nautilus", "Thresh", "Graves"],
      nerfedChampions: ["Azir", "LeBlanc", "Kalista"],
      buffedChampions: ["Jinx", "Caitlyn", "Tristana", "Nautilus", "Leona"]
    };
  }
  /**
   * Carga datos del meta de campeones (en producción desde API externa)
   */
  private loadChampionMetaData(): Map<string, ChampionMetaData> {
    const champions = new Map<string, ChampionMetaData>();
    
    // Datos del meta actual para campeones populares - Patch 14.23
    const champData: ChampionMetaData[] = [
      // === ADC CHAMPIONS ===
      {
        championId: 222,
        championName: "Jinx",
        tier: "S+",
        winRate: 52.8,
        pickRate: 18.4,
        banRate: 12.3,
        averageKDA: 2.34,
        averageCS: 6.8,
        averageDamage: 21500,
        roles: ["ADC"],
        difficulty: 6,
        counters: ["Draven", "Lucian", "Yasuo"],
        strongAgainst: ["Ezreal", "Varus", "Ashe"]
      },
      {
        championId: 51,
        championName: "Caitlyn",
        tier: "S",
        winRate: 51.9,
        pickRate: 22.1,
        banRate: 15.7,
        averageKDA: 2.28,
        averageCS: 6.9,
        averageDamage: 20800,
        roles: ["ADC"],
        difficulty: 7,
        counters: ["Draven", "Lucian", "Kai'Sa"],
        strongAgainst: ["Vayne", "Kog'Maw", "Twitch"]
      },
      {
        championId: 18,
        championName: "Tristana",
        tier: "A+",
        winRate: 50.6,
        pickRate: 8.9,
        banRate: 3.2,
        averageKDA: 2.41,
        averageCS: 6.5,
        averageDamage: 19200,
        roles: ["ADC"],
        difficulty: 5,
        counters: ["Caitlyn", "Varus", "Ashe"],
        strongAgainst: ["Vayne", "Kog'Maw", "Twitch"]
      },
      {
        championId: 81,
        championName: "Ezreal",
        tier: "A",
        winRate: 49.2,
        pickRate: 16.7,
        banRate: 2.1,
        averageKDA: 2.15,
        averageCS: 6.2,
        averageDamage: 18900,
        roles: ["ADC"],
        difficulty: 8,
        counters: ["Jinx", "Caitlyn", "Draven"],
        strongAgainst: ["Kog'Maw", "Varus", "Ashe"]
      },
      {
        championId: 119,
        championName: "Draven",
        tier: "A",
        winRate: 50.1,
        pickRate: 4.8,
        banRate: 8.9,
        averageKDA: 2.52,
        averageCS: 6.7,
        averageDamage: 22100,
        roles: ["ADC"],
        difficulty: 9,
        counters: ["Caitlyn", "Ezreal", "Sivir"],
        strongAgainst: ["Jinx", "Kog'Maw", "Vayne"]
      },
      {
        championId: 67,
        championName: "Vayne",
        tier: "B+",
        winRate: 49.8,
        pickRate: 12.3,
        banRate: 8.4,
        averageKDA: 2.19,
        averageCS: 6.4,
        averageDamage: 20200,
        roles: ["ADC"],
        difficulty: 9,
        counters: ["Caitlyn", "Draven", "Tristana"],
        strongAgainst: ["Jinx", "Kog'Maw", "Ashe"]
      },
      {
        championId: 110,
        championName: "Varus",
        tier: "B",
        winRate: 48.9,
        pickRate: 6.7,
        banRate: 2.1,
        averageKDA: 2.08,
        averageCS: 6.3,
        averageDamage: 19400,
        roles: ["ADC"],
        difficulty: 6,
        counters: ["Jinx", "Draven", "Yasuo"],
        strongAgainst: ["Kog'Maw", "Twitch", "Tristana"]
      },
      
      // === SUPPORT CHAMPIONS ===
      {
        championId: 111,
        championName: "Nautilus",
        tier: "S",
        winRate: 52.1,
        pickRate: 14.2,
        banRate: 18.4,
        averageKDA: 2.89,
        averageCS: 0.8,
        averageDamage: 8500,
        roles: ["Support"],
        difficulty: 4,
        counters: ["Morgana", "Lux", "Brand"],
        strongAgainst: ["Yuumi", "Sona", "Soraka"]
      },
      {
        championId: 412,
        championName: "Thresh",
        tier: "S",
        winRate: 51.7,
        pickRate: 16.8,
        banRate: 12.9,
        averageKDA: 2.76,
        averageCS: 0.9,
        averageDamage: 9200,
        roles: ["Support"],
        difficulty: 8,
        counters: ["Morgana", "Blitzcrank", "Pyke"],
        strongAgainst: ["Yuumi", "Sona", "Janna"]
      },
      {
        championId: 89,
        championName: "Leona",
        tier: "A+",
        winRate: 51.3,
        pickRate: 12.4,
        banRate: 8.7,
        averageKDA: 2.84,
        averageCS: 0.7,
        averageDamage: 7800,
        roles: ["Support"],
        difficulty: 5,
        counters: ["Morgana", "Lux", "Thresh"],
        strongAgainst: ["Yuumi", "Soraka", "Sona"]
      },
      {
        championId: 25,
        championName: "Morgana",
        tier: "A",
        winRate: 50.8,
        pickRate: 9.6,
        banRate: 15.2,
        averageKDA: 2.45,
        averageCS: 1.2,
        averageDamage: 11400,
        roles: ["Support"],
        difficulty: 6,
        counters: ["Blitzcrank", "Pyke", "Brand"],
        strongAgainst: ["Nautilus", "Thresh", "Leona"]
      },
      
      // === JUNGLE CHAMPIONS ===
      {
        championId: 104,
        championName: "Graves",
        tier: "S",
        winRate: 52.4,
        pickRate: 11.8,
        banRate: 9.3,
        averageKDA: 2.67,
        averageCS: 6.2,
        averageDamage: 18600,
        roles: ["Jungle"],
        difficulty: 7,
        counters: ["Kha'Zix", "Rengar", "Evelynn"],
        strongAgainst: ["Ammu", "Rammus", "Zac"]
      },
      {
        championId: 64,
        championName: "Lee Sin",
        tier: "A+",
        winRate: 49.7,
        pickRate: 18.9,
        banRate: 6.4,
        averageKDA: 2.34,
        averageCS: 5.8,
        averageDamage: 16800,
        roles: ["Jungle"],
        difficulty: 9,
        counters: ["Graves", "Karthus", "Fiddle"],
        strongAgainst: ["Ammu", "Rammus", "Sejuani"]
      },
      {
        championId: 121,
        championName: "Kha'Zix",
        tier: "A",
        winRate: 50.9,
        pickRate: 8.7,
        banRate: 12.8,
        averageKDA: 2.58,
        averageCS: 5.6,
        averageDamage: 17200,
        roles: ["Jungle"],
        difficulty: 8,
        counters: ["Lee Sin", "Graves", "Elise"],
        strongAgainst: ["Kindred", "Nidalee", "Lillia"]
      },
      
      // === MID LANE CHAMPIONS ===
      {
        championId: 238,
        championName: "Zed",
        tier: "A+",
        winRate: 50.8,
        pickRate: 12.4,
        banRate: 18.7,
        averageKDA: 2.42,
        averageCS: 7.1,
        averageDamage: 19800,
        roles: ["Mid"],
        difficulty: 9,
        counters: ["Malzahar", "Lissandra", "Fizz"],
        strongAgainst: ["Azir", "Orianna", "Syndra"]
      },
      {
        championId: 7,
        championName: "LeBlanc",
        tier: "B+",
        winRate: 48.9,
        pickRate: 6.8,
        banRate: 8.2,
        averageKDA: 2.31,
        averageCS: 6.8,
        averageDamage: 18400,
        roles: ["Mid"],
        difficulty: 9,
        counters: ["Malzahar", "Galio", "Kassadin"],
        strongAgainst: ["Azir", "Orianna", "Vel'Koz"]
      },
      
      // === TOP LANE CHAMPIONS ===
      {
        championId: 86,
        championName: "Garen",
        tier: "A",
        winRate: 51.2,
        pickRate: 8.9,
        banRate: 4.3,
        averageKDA: 2.18,
        averageCS: 6.4,
        averageDamage: 15600,
        roles: ["Top"],
        difficulty: 3,
        counters: ["Darius", "Mordekaiser", "Teemo"],
        strongAgainst: ["Yasuo", "Riven", "Fiora"]
      },
      {        championId: 122,
        championName: "Darius",
        tier: "A",
        winRate: 50.6,
        pickRate: 9.7,
        banRate: 11.8,
        averageKDA: 2.24,
        averageCS: 6.2,
        averageDamage: 16200,
        roles: ["Top"],
        difficulty: 5,
        counters: ["Gnar", "Kennen", "Quinn"],
        strongAgainst: ["Garen", "Nasus", "Malphite"]
      }
    ];

    champData.forEach(champ => {
      champions.set(champ.championName, champ);
    });

    return champions;
  }

  /**
   * Carga builds óptimas por campeón
   */
  private loadOptimalBuilds(): Map<string, OptimalBuild[]> {
    const builds = new Map<string, OptimalBuild[]>();
    
    // Builds actuales del meta (Patch 14.23)
    const buildData: OptimalBuild[] = [
      {
        championName: "Jinx",
        role: "ADC",
        winRate: 54.2,
        sampleSize: 125000,
        items: {
          core: [6672, 3031, 3036], // Kraken Slayer, IE, LDR
          boots: [3006], // Berserker's Greaves
          situational: [3139, 3812, 6333] // Mercurial, Deaths Dance, BT
        },
        runes: {
          primary: "Precision",
          secondary: "Inspiration",
          keystone: "Lethal Tempo"
        },
        startingItems: [1055, 2003], // Doran's Blade, Potion
        skillOrder: "Q>W>E"
      },
      {
        championName: "Caitlyn",
        role: "ADC",
        winRate: 52.8,
        sampleSize: 98000,
        items: {
          core: [6672, 3031, 3094], // Kraken Slayer, IE, RFC
          boots: [3006], // Berserker's Greaves
          situational: [3139, 3036, 6333] // Mercurial, LDR, BT
        },
        runes: {
          primary: "Precision",
          secondary: "Sorcery",
          keystone: "Lethal Tempo"
        },
        startingItems: [1055, 2003], // Doran's Blade, Potion
        skillOrder: "Q>W>E"
      },
      {
        championName: "Nautilus",
        role: "Support",
        winRate: 53.1,
        sampleSize: 87000,
        items: {
          core: [3190, 2065, 3143], // Locket, Shurelya's, Zeke's
          boots: [3047], // Ninja Tabi
          situational: [3109, 3001, 3110] // Knight's Vow, Evenshroud, FH
        },
        runes: {
          primary: "Resolve",
          secondary: "Inspiration",
          keystone: "Aftershock"
        },
        startingItems: [3854, 2003, 3340], // Spectral Sickle, Potion, Ward
        skillOrder: "Q>E>W"
      },
      {
        championName: "Thresh",
        role: "Support",
        winRate: 52.4,
        sampleSize: 112000,
        items: {
          core: [3190, 3109, 2065], // Locket, Knight's Vow, Shurelya's
          boots: [3047], // Ninja Tabi
          situational: [3143, 3001, 3110] // Zeke's, Evenshroud, FH
        },
        runes: {
          primary: "Resolve",
          secondary: "Inspiration",
          keystone: "Aftershock"
        },
        startingItems: [3854, 2003, 3340], // Spectral Sickle, Potion, Ward
        skillOrder: "Q>E>W"
      }
    ];

    // Agrupar builds por campeón
    buildData.forEach(build => {
      const existing = builds.get(build.championName) || [];
      existing.push(build);
      builds.set(build.championName, existing);
    });

    return builds;
  }
  /**
   * Analiza el rendimiento de un campeón en el meta actual
   */
  public analyzeChampionMeta(championName: string, playerPerformance: any): any {
    const metaData = this.champions.get(championName);
    if (!metaData) {
      return {
        tier: 'C',
        metaScore: 5.0,
        winRate: 50.0,
        pickRate: 5.0,
        banRate: 5.0,
        difficulty: 5,
        counters: [],
        strongAgainst: [],
        comparisons: {
          kdaVsMeta: 100,
          csVsMeta: 100,
          damageVsMeta: 100
        },
        recommendation: 'No meta data available for this champion'
      };
    }

    // Calcular score del meta (1-10)
    const metaScore = this.calculateMetaScore(metaData);
    
    // Comparar performance del jugador vs meta promedio
    const comparisons = {
      kdaVsMeta: Math.round((playerPerformance.kda / metaData.averageKDA) * 100),
      csVsMeta: Math.round((playerPerformance.csPerMinute / metaData.averageCS) * 100),
      damageVsMeta: Math.round((playerPerformance.damagePerMinute / (metaData.averageDamage / 35)) * 100) // Asumiendo 35min promedio
    };

    // Generar recomendación
    const recommendation = this.generateChampionRecommendation(metaData, comparisons);

    return {
      tier: metaData.tier,
      metaScore,
      winRate: metaData.winRate,
      pickRate: metaData.pickRate,
      banRate: metaData.banRate,
      difficulty: metaData.difficulty,
      counters: metaData.counters,
      strongAgainst: metaData.strongAgainst,
      comparisons,
      recommendation
    };
  }

  /**
   * Calcula el score del meta para un campeón (1-10)
   */
  private calculateMetaScore(metaData: ChampionMetaData): number {
    const tierScores = {
      'S+': 9.5,
      'S': 8.5,
      'A+': 7.5,
      'A': 6.5,
      'B+': 5.5,
      'B': 4.5,
      'C+': 3.5,
      'C': 2.5,
      'D': 1.5
    };

    const baseTierScore = tierScores[metaData.tier] || 5.0;
    
    // Ajustar basado en win rate
    const winRateModifier = (metaData.winRate - 50) * 0.1; // +/- 0.5 por cada 5% de WR
    
    // Ajustar basado en pick rate (popularidad)
    const pickRateModifier = Math.min((metaData.pickRate - 10) * 0.05, 1.0); // Bonus por popularidad
    
    // Ajustar basado en ban rate (que tan problemático es)
    const banRateModifier = Math.min(metaData.banRate * 0.02, 0.5); // Pequeño bonus por ser baneable
    
    const finalScore = baseTierScore + winRateModifier + pickRateModifier + banRateModifier;
    
    return Math.max(1.0, Math.min(10.0, Math.round(finalScore * 10) / 10));
  }

  /**
   * Genera recomendaciones específicas para el campeón
   */
  private generateChampionRecommendation(metaData: ChampionMetaData, comparisons: any): string {
    const recommendations = [];
    
    // Análisis de tier
    if (['S+', 'S'].includes(metaData.tier)) {
      recommendations.push(`${metaData.championName} is currently ${metaData.tier} tier - excellent meta pick`);
    } else if (['A+', 'A'].includes(metaData.tier)) {
      recommendations.push(`${metaData.championName} is ${metaData.tier} tier - solid meta choice`);
    } else if (['B+', 'B'].includes(metaData.tier)) {
      recommendations.push(`${metaData.championName} is ${metaData.tier} tier - situational pick`);
    } else {
      recommendations.push(`${metaData.championName} is ${metaData.tier} tier - consider stronger alternatives`);
    }

    // Análisis de performance vs meta
    if (comparisons.kdaVsMeta >= 110) {
      recommendations.push('Your KDA is above meta average - great performance!');
    } else if (comparisons.kdaVsMeta <= 90) {
      recommendations.push('Your KDA is below meta average - focus on positioning');
    }

    if (comparisons.csVsMeta >= 110) {
      recommendations.push('Your CS is above meta average - excellent farming');
    } else if (comparisons.csVsMeta <= 90) {
      recommendations.push('Your CS is below meta average - practice last hitting');
    }

    if (comparisons.damageVsMeta >= 110) {
      recommendations.push('Your damage output exceeds meta average - keep it up!');
    } else if (comparisons.damageVsMeta <= 90) {
      recommendations.push('Your damage is below meta average - work on trading and positioning');
    }

    // Análisis de dificultad
    if (metaData.difficulty >= 8) {
      recommendations.push('High difficulty champion - master the mechanics for best results');
    } else if (metaData.difficulty <= 4) {
      recommendations.push('Consistent champion choice - focus on macro play and positioning');
    }    return recommendations.join('. ');
  }

  /**
   * Obtiene la build óptima para un campeón
   */
  public getOptimalBuild(championName: string, role?: string): OptimalBuild | null {
    const builds = this.builds.get(championName);
    if (!builds || builds.length === 0) return null;
    
    if (role) {
      return builds.find(b => b.role === role) || builds[0];
    }
    return builds[0];
  }

  /**
   * Genera recomendaciones basadas en el meta actual
   */
  public generateMetaRecommendations(championsPlayed: string[], currentRank: string): any {
    const tierPriority = { "S+": 5, "S": 4, "A+": 3, "A": 2, "B+": 1, "B": 0, "C+": -1, "C": -2, "D": -3 };
    
    // Analizar campeones actuales
    const currentPoolAnalysis = championsPlayed.map(champ => {
      const metaData = this.champions.get(champ);
      return {
        champion: champ,
        tier: metaData?.tier || "Unknown",
        tierScore: tierPriority[metaData?.tier as keyof typeof tierPriority] || 0,
        winRate: metaData?.winRate || 50,
        difficulty: metaData?.difficulty || 5
      };
    });

    // Encontrar mejores picks del meta
    const topMetaPicks = Array.from(this.champions.values())
      .filter(champ => ["S+", "S", "A+"].includes(champ.tier))
      .sort((a, b) => tierPriority[b.tier] - tierPriority[a.tier])
      .slice(0, 5);

    // Recomendaciones específicas
    const recommendations = {
      strengthenPool: topMetaPicks
        .filter(champ => !championsPlayed.includes(champ.championName))
        .slice(0, 3)
        .map(champ => ({
          champion: champ.championName,
          tier: champ.tier,
          winRate: champ.winRate,
          reason: `${champ.tier} tier pick with ${champ.winRate}% win rate`
        })),
      
      maintainFocus: currentPoolAnalysis
        .filter(champ => ["S+", "S", "A+"].includes(champ.tier))
        .map(champ => ({
          champion: champ.champion,
          tier: champ.tier,
          reason: "Strong meta pick - keep playing"
        })),
        
      considerReplacing: currentPoolAnalysis
        .filter(champ => ["B", "C+", "C", "D"].includes(champ.tier))
        .map(champ => ({
          champion: champ.champion,
          tier: champ.tier,
          reason: "Below meta - consider alternatives"
        }))
    };

    return {
      metaContext: this.metaContext,
      currentPoolScore: Math.round(
        currentPoolAnalysis.reduce((sum, champ) => sum + champ.tierScore, 0) / 
        Math.max(currentPoolAnalysis.length, 1) * 2 + 5
      ),
      recommendations,
      topMetaPicks: topMetaPicks.slice(0, 3)
    };
  }

  /**
   * Obtiene el contexto completo del meta para la IA
   */
  public getMetaContext(): MetaContext | null {
    return this.metaContext;
  }

  /**
   * Verifica si los datos del meta necesitan actualización
   */
  public needsUpdate(): boolean {
    if (!this.lastUpdate) return true;
    return Date.now() - this.lastUpdate.getTime() > this.updateInterval;
  }
}

export default MetaAnalysisService;
