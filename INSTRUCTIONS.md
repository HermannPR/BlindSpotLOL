# LOL Analyzer MVP - Instrucciones Técnicas Completas

## 📋 RESUMEN DEL PROYECTO

**Objetivo**: MVP de análisis de League of Legends con IA que evolucione hacia analizador de drafts en tiempo real

**Stack Tecnológico:**
- Frontend: React + Next.js
- Backend: Node.js + Express
- Base de Datos: MySQL 8.0
- IA: OpenAI/Claude API
- Deploy: Vercel (frontend) + Railway/Render (backend)
- Cache futuro: Redis (v2)

## 🎯 FUNCIONALIDADES CORE DEL MVP

1. **Búsqueda de Summoner** - Input con nombre de invocador + región
2. **Estadísticas Básicas** - KDA, win rate, campeones más jugados
3. **Análisis IA Personalizado** - Fortalezas, debilidades, recomendaciones
4. **Coach Virtual** - Chat para preguntas específicas sobre gameplay
5. **Predicciones Inteligentes** - Recomendaciones de campeones con IA

## 📅 CRONOGRAMA DE IMPLEMENTACIÓN (20 DÍAS)

### SEMANA 1: SETUP Y CONFIGURACIÓN

#### Día 1: Configuración Inicial

**Estructura del Proyecto:**
```
lol-analyzer-mvp/
├── frontend/          # Next.js app
├── backend/           # Express API
├── shared/           # Tipos TypeScript compartidos
├── docs/             # Documentación
└── README.md
```

**Comandos de Setup:**
```bash
mkdir lol-analyzer-mvp
cd lol-analyzer-mvp
npx create-next-app@latest frontend --typescript --tailwind --eslint
mkdir backend shared docs
cd backend && npm init -y
```

#### Día 2: Setup Backend

**Dependencias Backend:**
```bash
npm install express cors dotenv axios helmet morgan mysql2 express-rate-limit winston
npm install -D nodemon concurrently jest supertest
```

**Variables de Entorno (.env):**
```env
# Riot API
RIOT_API_KEY=your_riot_api_key_here

# AI Configuration
AI_API_KEY=your_ai_api_key_here
AI_API_PROVIDER=openai
AI_MODEL=gpt-3.5-turbo

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lol_analyzer

# Server Configuration
PORT=3001
NODE_ENV=development
```

#### Día 3: Setup Frontend

**Dependencias Frontend:**
```bash
cd frontend
npm install axios @tanstack/react-query lucide-react clsx tailwind-merge
npm install -D @types/node
```

### SEMANA 2: CORE DEVELOPMENT

#### Día 4-5: MySQL Database Setup

**Configuración de Conexión (config/database.js):**
```javascript
const mysql = require('mysql2/promise');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) return;

        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            charset: 'utf8mb4',
            timezone: '+00:00'
        });

        // Test connection
        try {
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            this.isConnected = true;
            console.log('✅ MySQL connected successfully');
        } catch (error) {
            console.error('❌ MySQL connection failed:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        if (!this.isConnected) {
            await this.connect();
        }
        const [results] = await this.pool.execute(sql, params);
        return results;
    }

    async transaction(callback) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new DatabaseManager();
```

**Schema de Base de Datos (init.sql):**
```sql
CREATE DATABASE IF NOT EXISTS lol_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lol_analyzer;

-- Tabla de summoners
CREATE TABLE IF NOT EXISTS summoners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puuid VARCHAR(100) UNIQUE NOT NULL,
    summoner_id VARCHAR(100) NOT NULL,
    account_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(10) NOT NULL,
    level INT DEFAULT 0,
    profile_icon_id INT DEFAULT 0,
    revision_date BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_puuid (puuid),
    INDEX idx_name_region (name, region)
) ENGINE=InnoDB;

-- Tabla de matches
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(50) UNIQUE NOT NULL,
    region VARCHAR(10) NOT NULL,
    game_duration INT DEFAULT 0,
    game_mode VARCHAR(50),
    game_version VARCHAR(20),
    queue_id INT,
    game_creation BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_match_id (match_id),
    INDEX idx_region (region),
    INDEX idx_game_creation (game_creation)
) ENGINE=InnoDB;

-- Tabla de participantes en matches
CREATE TABLE IF NOT EXISTS match_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL,
    puuid VARCHAR(100) NOT NULL,
    champion_id INT NOT NULL,
    champion_name VARCHAR(50),
    position VARCHAR(20),
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    assists INT DEFAULT 0,
    total_damage_dealt_to_champions INT DEFAULT 0,
    vision_score INT DEFAULT 0,
    gold_earned INT DEFAULT 0,
    total_minions_killed INT DEFAULT 0,
    items JSON,
    win BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
    INDEX idx_match_puuid (match_id, puuid),
    INDEX idx_puuid (puuid),
    INDEX idx_champion_id (champion_id)
) ENGINE=InnoDB;

-- Tabla de análisis de IA (cache)
CREATE TABLE IF NOT EXISTS ai_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puuid VARCHAR(100) NOT NULL,
    region VARCHAR(10) NOT NULL,
    analysis_type ENUM('performance', 'recommendations', 'champion_suggestions') NOT NULL,
    analysis_data JSON NOT NULL,
    matches_analyzed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    UNIQUE KEY unique_analysis (puuid, region, analysis_type),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- Tabla de conversaciones con coach
CREATE TABLE IF NOT EXISTS coach_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puuid VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_puuid (puuid)
) ENGINE=InnoDB;
```

#### Día 6-7: Riot API Integration

**Servicio Riot API (services/riotAPI.js):**
```javascript
const axios = require('axios');

class RiotAPIService {
    constructor() {
        this.apiKey = process.env.RIOT_API_KEY;
        this.baseUrls = {
            'na1': 'https://na1.api.riotgames.com',
            'euw1': 'https://euw1.api.riotgames.com',
            'kr': 'https://kr.api.riotgames.com',
            // Agregar más regiones según necesidad
        };
        this.regionalUrls = {
            'americas': 'https://americas.api.riotgames.com',
            'europe': 'https://europe.api.riotgames.com',
            'asia': 'https://asia.api.riotgames.com'
        };
    }

    getRegionalCluster(region) {
        const clusters = {
            'na1': 'americas', 'br1': 'americas', 'la1': 'americas', 'la2': 'americas',
            'euw1': 'europe', 'eun1': 'europe', 'tr1': 'europe', 'ru': 'europe',
            'kr': 'asia', 'jp1': 'asia'
        };
        return clusters[region] || 'americas';
    }

    async getSummonerByName(region, summonerName) {
        try {
            const response = await axios.get(
                `${this.baseUrls[region]}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
                { headers: { 'X-Riot-Token': this.apiKey } }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Summoner not found: ${error.response?.status}`);
        }
    }

    async getMatchHistory(region, puuid, count = 20) {
        try {
            const cluster = this.getRegionalCluster(region);
            const response = await axios.get(
                `${this.regionalUrls[cluster]}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
                { 
                    headers: { 'X-Riot-Token': this.apiKey },
                    params: { count }
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Match history error: ${error.response?.status}`);
        }
    }

    async getMatchDetails(region, matchId) {
        try {
            const cluster = this.getRegionalCluster(region);
            const response = await axios.get(
                `${this.regionalUrls[cluster]}/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': this.apiKey } }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Match details error: ${error.response?.status}`);
        }
    }
}

module.exports = new RiotAPIService();
```

**Servicio Database (services/database.js):**
```javascript
const pool = require('../config/database');

class DatabaseService {
    async saveSummoner(summonerData) {
        const query = `
            INSERT INTO summoners (puuid, summoner_id, account_id, name, region, level, profile_icon_id, revision_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            level = VALUES(level),
            profile_icon_id = VALUES(profile_icon_id),
            updated_at = CURRENT_TIMESTAMP
        `;
        
        return await pool.query(query, [
            summonerData.puuid,
            summonerData.id,
            summonerData.accountId,
            summonerData.name,
            summonerData.region,
            summonerData.summonerLevel,
            summonerData.profileIconId,
            summonerData.revisionDate
        ]);
    }

    async saveMatch(matchData) {
        return await pool.transaction(async (connection) => {
            // Insertar match
            const matchQuery = `
                INSERT IGNORE INTO matches 
                (match_id, region, game_duration, game_mode, game_version, queue_id, game_creation)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            await connection.execute(matchQuery, [
                matchData.metadata.matchId,
                matchData.info.platformId,
                matchData.info.gameDuration,
                matchData.info.gameMode,
                matchData.info.gameVersion,
                matchData.info.queueId,
                matchData.info.gameCreation
            ]);
            
            // Insertar participantes
            const participantQuery = `
                INSERT IGNORE INTO match_participants 
                (match_id, puuid, champion_id, champion_name, position, kills, deaths, assists, 
                 total_damage_dealt_to_champions, vision_score, gold_earned, total_minions_killed, items, win)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            for (let i = 0; i < matchData.info.participants.length; i++) {
                const participant = matchData.info.participants[i];
                const puuid = matchData.metadata.participants[i];
                
                await connection.execute(participantQuery, [
                    matchData.metadata.matchId,
                    puuid,
                    participant.championId,
                    participant.championName,
                    participant.teamPosition,
                    participant.kills,
                    participant.deaths,
                    participant.assists,
                    participant.totalDamageDealtToChampions,
                    participant.visionScore,
                    participant.goldEarned,
                    participant.totalMinionsKilled,
                    JSON.stringify([
                        participant.item0, participant.item1, participant.item2,
                        participant.item3, participant.item4, participant.item5, participant.item6
                    ]),
                    participant.win
                ]);
            }
        });
    }

    async getPlayerStats(puuid, region, limit = 20) {
        const query = `
            SELECT mp.*, m.game_duration, m.game_creation
            FROM match_participants mp
            JOIN matches m ON mp.match_id = m.match_id
            WHERE mp.puuid = ? AND m.region = ?
            ORDER BY m.game_creation DESC
            LIMIT ?
        `;
        
        return await pool.query(query, [puuid, region, limit]);
    }

    async saveAIAnalysis(puuid, region, analysisType, analysisData, matchesAnalyzed) {
        const query = `
            INSERT INTO ai_analysis (puuid, region, analysis_type, analysis_data, matches_analyzed, expires_at)
            VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
            ON DUPLICATE KEY UPDATE
            analysis_data = VALUES(analysis_data),
            matches_analyzed = VALUES(matches_analyzed),
            expires_at = VALUES(expires_at),
            created_at = CURRENT_TIMESTAMP
        `;
        
        return await pool.query(query, [
            puuid, region, analysisType, JSON.stringify(analysisData), matchesAnalyzed
        ]);
    }

    async getAIAnalysis(puuid, region, analysisType) {
        const query = `
            SELECT analysis_data, matches_analyzed, created_at
            FROM ai_analysis
            WHERE puuid = ? AND region = ? AND analysis_type = ? AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        `;
        
        const results = await pool.query(query, [puuid, region, analysisType]);
        return results.length > 0 ? results[0] : null;
    }
}

module.exports = new DatabaseService();
```

#### Día 8-9: IA Integration

**Servicio AI Analyzer (services/aiAnalyzer.js):**
```javascript
const database = require('./database');

class AIAnalyzer {
    async analyzePlayerPerformance(puuid, region) {
        // Verificar cache
        const existingAnalysis = await database.getAIAnalysis(puuid, region, 'performance');
        if (existingAnalysis) {
            return JSON.parse(existingAnalysis.analysis_data);
        }
        
        // Obtener datos del jugador
        const playerStats = await database.getPlayerStats(puuid, region, 20);
        
        if (playerStats.length === 0) {
            throw new Error('No hay datos suficientes para análisis');
        }
        
        const analysisData = this.processPlayerData(playerStats);
        const prompt = this.buildAnalysisPrompt(analysisData, playerStats);
        
        const response = await this.callAIAPI(prompt);
        const analysis = JSON.parse(response);
        
        // Guardar en cache
        await database.saveAIAnalysis(puuid, region, 'performance', analysis, playerStats.length);
        
        return analysis;
    }

    processPlayerData(matches) {
        const totalMatches = matches.length;
        const wins = matches.filter(m => m.win).length;
        
        // Calcular estadísticas
        const stats = {
            winRate: ((wins / totalMatches) * 100).toFixed(1),
            avgKDA: `${(matches.reduce((sum, m) => sum + m.kills, 0) / totalMatches).toFixed(1)}/${(matches.reduce((sum, m) => sum + m.deaths, 0) / totalMatches).toFixed(1)}/${(matches.reduce((sum, m) => sum + m.assists, 0) / totalMatches).toFixed(1)}`,
            avgDamage: Math.round(matches.reduce((sum, m) => sum + m.total_damage_dealt_to_champions, 0) / totalMatches),
            avgVisionScore: Math.round(matches.reduce((sum, m) => sum + m.vision_score, 0) / totalMatches)
        };
        
        // Top campeones
        const championCounts = {};
        matches.forEach(match => {
            championCounts[match.champion_name] = (championCounts[match.champion_name] || 0) + 1;
        });
        
        stats.topChampions = Object.entries(championCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([champion, count]) => `${champion} (${count})`);
        
        return stats;
    }

    buildAnalysisPrompt(analysisData, playerStats) {
        return `
        Analiza este jugador de League of Legends y responde SOLO con un JSON válido:
        
        Estadísticas generales:
        - Win rate: ${analysisData.winRate}%
        - KDA promedio: ${analysisData.avgKDA}
        - Daño promedio: ${analysisData.avgDamage}
        - Vision score promedio: ${analysisData.avgVisionScore}
        - Campeones más jugados: ${analysisData.topChampions.join(', ')}
        
        Últimas 10 partidas:
        ${playerStats.slice(0, 10).map(match => 
            `- ${match.champion_name}: ${match.kills}/${match.deaths}/${match.assists}, ${match.win ? 'Victoria' : 'Derrota'}`
        ).join('\n')}
        
        Responde con este formato JSON exacto:
        {
            "strengths": ["fortaleza1", "fortaleza2", "fortaleza3"],
            "weaknesses": ["debilidad1", "debilidad2", "debilidad3"],
            "recommendations": ["recomendación1", "recomendación2", "recomendación3"],
            "championSuggestions": [
                {"name": "campeón1", "reason": "razón detallada"},
                {"name": "campeón2", "reason": "razón detallada"}
            ],
            "playStyleAnalysis": "descripción del estilo de juego en una oración"
        }
        `;
    }

    async callAIAPI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un experto analista de League of Legends. Responde siempre con JSON válido.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
}

module.exports = new AIAnalyzer();
```

### SEMANA 3: FRONTEND DEVELOPMENT

#### Día 10-11: Componentes Principales

**Componente de Búsqueda (components/SummonerSearch.tsx):**
```typescript
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface SummonerSearchProps {
    onSearch: (region: string, summonerName: string) => void;
    loading: boolean;
}

const SummonerSearch: React.FC<SummonerSearchProps> = ({ onSearch, loading }) => {
    const [region, setRegion] = useState('na1');
    const [summonerName, setSummonerName] = useState('');

    const regions = [
        { value: 'na1', label: 'North America' },
        { value: 'euw1', label: 'Europe West' },
        { value: 'kr', label: 'Korea' },
        { value: 'br1', label: 'Brazil' },
        // Agregar más regiones
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (summonerName.trim()) {
            onSearch(region, summonerName.trim());
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="inline w-4 h-4 mr-1" />
                        Región
                    </label>
                    <select 
                        value={region} 
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                        {regions.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de Invocador
                    </label>
                    <input
                        type="text"
                        value={summonerName}
                        onChange={(e) => setSummonerName(e.target.value)}
                        placeholder="Ingresa tu nombre de invocador..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading || !summonerName.trim()}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Analizando...
                        </>
                    ) : (
                        <>
                            <Search className="w-4 h-4" />
                            Analizar Jugador
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default SummonerSearch;
```

**Componente de Estadísticas (components/PlayerStats.tsx):**
```typescript
import { Trophy, Target, Zap } from 'lucide-react';

interface PlayerStatsProps {
    stats: {
        winRate: string;
        averageKDA: {
            kills: string;
            deaths: string;
            assists: string;
            ratio: string;
        };
        totalMatches: number;
        topChampions: Array<{
            name: string;
            games: number;
            winRate: string;
        }>;
    };
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ stats }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Estadísticas del Jugador</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                        <Trophy className="w-5 h-5 text-green-600 mr-2" />
                        <span className="font-semibold text-green-800">Win Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{stats.winRate}%</div>
                    <div className="text-sm text-green-700">{stats.totalMatches} partidas</div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                        <Target className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-semibold text-blue-800">KDA Promedio</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                        {stats.averageKDA.kills}/{stats.averageKDA.deaths}/{stats.averageKDA.assists}
                    </div>
                    <div className="text-sm text-blue-700">Ratio: {stats.averageKDA.ratio}</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                        <Zap className="w-5 h-5 text-purple-600 mr-2" />
                        <span className="font-semibold text-purple-800">Partidas Jugadas</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{stats.totalMatches}</div>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4">Campeones Más Jugados</h3>
                <div className="space-y-3">
                    {stats.topChampions.map((champion, index) => (
                        <div key={champion.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                    {index + 1}
                                </span>
                                <span className="font-medium">{champion.name}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">{champion.games} partidas</div>
                                <div className="text-sm text-gray-600">{champion.winRate}% WR</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlayerStats;
```

#### Día 12-13: API Routes y Páginas

**API Route Principal (pages/api/summoner/[region]/[name].ts):**
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import riotAPI from '../../../../lib/riotAPI';
import database from '../../../../lib/database';
import aiAnalyzer from '../../../../lib/aiAnalyzer';

interface ApiResponse {
    summoner?: any;
    matches?: any[];
    stats?: any;
    aiAnalysis?: any;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { region, name } = req.query;

        if (!region || !name || typeof region !== 'string' || typeof name !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid parameters' });
        }

        // Obtener datos del summoner
        const summonerData = await riotAPI.getSummonerByName(region, name);
        await database.saveSummoner({ ...summonerData, region });

        // Obtener y guardar matches
        const matchHistory = await riotAPI.getMatchHistory(region, summonerData.puuid, 20);
        
        // Procesar matches en paralelo (limitado)
        const matchProcessingPromises = matchHistory.slice(0, 10).map(async (matchId) => {
            try {
                const matchDetails = await riotAPI.getMatchDetails(region, matchId);
                await database.saveMatch(matchDetails);
            } catch (error) {
                console.error(`Error processing match ${matchId}:`, error);
            }
        });

        await Promise.allSettled(matchProcessingPromises);

        // Obtener stats procesadas
        const playerStats = await database.getPlayerStats(summonerData.puuid, region, 20);
        
        // Calcular estadísticas
        const stats = calculateStats(playerStats);
        
        // Obtener análisis de IA
        let aiAnalysis = null;
        try {
            if (playerStats.length >= 5) {
                aiAnalysis = await aiAnalyzer.analyzePlayerPerformance(summonerData.puuid, region);
            }
        } catch (error) {
            console.error('Error getting AI analysis:', error);
        }

        res.json({
            summoner: summonerData,
            matches: playerStats.slice(0, 10), // Solo últimas 10 para el frontend
            stats,
            aiAnalysis
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Error interno del servidor' 
        });
    }
}

function calculateStats(matches: any[]) {
    if (!matches.length) return null;
    
    const totalMatches = matches.length;
    const wins = matches.filter(m => m.win).length;
    const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);
    const totalDeaths = matches.reduce((sum, m) => sum + m.deaths, 0);
    const totalAssists = matches.reduce((sum, m) => sum + m.assists, 0);
    
    // Campeones más jugados
    const championCounts: { [key: string]: number } = {};
    matches.forEach(match => {
        championCounts[match.champion_name] = (championCounts[match.champion_name] || 0) + 1;
    });
    
    const topChampions = Object.entries(championCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([champion, count]) => ({
            name: champion,
            games: count,
            winRate: ((matches.filter(m => m.champion_name === champion && m.win).length / count) * 100).toFixed(1)
        }));

    return {
        winRate: ((wins / totalMatches) * 100).toFixed(1),
        averageKDA: {
            kills: (totalKills / totalMatches).toFixed(1),
            deaths: (totalDeaths / totalMatches).toFixed(1),
            assists: (totalAssists / totalMatches).toFixed(1),
            ratio: totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : 'Perfect'
        },
        totalMatches,
        wins,
        losses: totalMatches - wins,
        topChampions
    };
}
```

**Página Principal (pages/index.tsx):**
```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SummonerSearch from '../components/SummonerSearch';
import PlayerStats from '../components/PlayerStats';
import AIAnalysis from '../components/AIAnalysis';
import MatchHistory from '../components/MatchHistory';

interface SearchParams {
    region: string;
    summonerName: string;
}

export default function Home() {
    const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['summoner', searchParams?.region, searchParams?.summonerName],
        queryFn: async () => {
            if (!searchParams) return null;
            const response = await fetch(`/api/summoner/${searchParams.region}/${searchParams.summonerName}`);
            if (!response.ok) {
                throw new Error('Error al buscar el jugador');
            }
            return response.json();
        },
        enabled: !!searchParams,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    const handleSearch = (region: string, summonerName: string) => {
        setSearchParams({ region, summonerName });
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        LOL Analyzer MVP
                    </h1>
                    <p className="text-lg text-gray-600">
                        Analiza tu rendimiento en League of Legends con IA
                    </p>
                </div>

                <SummonerSearch onSearch={handleSearch} loading={isLoading} />

                {error && (
                    <div className="mt-8 max-w-2xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-red-800">
                                ❌ {error instanceof Error ? error.message : 'Error desconocido'}
                            </div>
                        </div>
                    </div>
                )}

                {data && (
                    <div className="mt-8 space-y-8">
                        {/* Información del Summoner */}
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">
                                            {data.summoner.summonerLevel}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{data.summoner.name}</h2>
                                        <p className="text-gray-600">Nivel {data.summoner.summonerLevel}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Estadísticas */}
                        {data.stats && (
                            <div className="max-w-4xl mx-auto">
                                <PlayerStats stats={data.stats} />
                            </div>
                        )}

                        {/* Análisis de IA */}
                        {data.aiAnalysis && (
                            <div className="max-w-4xl mx-auto">
                                <AIAnalysis analysis={data.aiAnalysis} />
                            </div>
                        )}

                        {/* Historial de Partidas */}
                        {data.matches && (
                            <div className="max-w-4xl mx-auto">
                                <MatchHistory matches={data.matches} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
```

**Componente de Análisis IA (components/AIAnalysis.tsx):**
```typescript
import { Brain, TrendingUp, TrendingDown, Lightbulb, Star } from 'lucide-react';

interface AIAnalysisProps {
    analysis: {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
        championSuggestions: Array<{
            name: string;
            reason: string;
        }>;
        playStyleAnalysis: string;
    };
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ analysis }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
                <Brain className="w-6 h-6 text-purple-600 mr-2" />
                <h2 className="text-2xl font-bold">Análisis con IA</h2>
            </div>
            
            {/* Estilo de Juego */}
            <div className="mb-8 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Estilo de Juego</h3>
                <p className="text-purple-700">{analysis.playStyleAnalysis}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Fortalezas */}
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                        <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                        <h3 className="font-semibold text-green-800">Fortalezas</h3>
                    </div>
                    <ul className="space-y-2">
                        {analysis.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span className="text-green-700">{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Debilidades */}
                <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                        <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                        <h3 className="font-semibold text-red-800">Áreas de Mejora</h3>
                    </div>
                    <ul className="space-y-2">
                        {analysis.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-red-600 mr-2">!</span>
                                <span className="text-red-700">{weakness}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Recomendaciones */}
            <div className="mb-8">
                <div className="flex items-center mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                    <h3 className="font-semibold text-gray-800">Recomendaciones</h3>
                </div>
                <div className="space-y-3">
                    {analysis.recommendations.map((recommendation, index) => (
                        <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                            <p className="text-yellow-800">{recommendation}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sugerencias de Campeones */}
            <div>
                <div className="flex items-center mb-4">
                    <Star className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-gray-800">Campeones Recomendados</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.championSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">{suggestion.name}</h4>
                            <p className="text-blue-700 text-sm">{suggestion.reason}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIAnalysis;
```

#### Día 14: Configuración Final y Optimización

**Middleware de Rate Limiting (middleware/rateLimiter.js):**
```javascript
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({ error: message });
        }
    });
};

const apiLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutos
    100, // 100 requests por IP
    'Demasiadas solicitudes, intenta de nuevo en 15 minutos'
);

const searchLimiter = createRateLimiter(
    60 * 1000, // 1 minuto
    10, // 10 búsquedas por minuto
    'Límite de búsquedas excedido, espera 1 minuto'
);

const aiLimiter = createRateLimiter(
    60 * 1000, // 1 minuto
    5, // 5 análisis de IA por minuto
    'Límite de análisis de IA excedido, espera 1 minuto'
);

module.exports = {
    apiLimiter,
    searchLimiter,
    aiLimiter
};
```

**Logger y Error Handling (utils/logger.js):**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'lol-analyzer' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ],
});

if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
    }));
    logger.add(new winston.transports.File({ 
        filename: 'logs/combined.log' 
    }));
}

module.exports = logger;
```

### SEMANA 4: TESTING Y DEPLOY

#### Día 15-16: Testing

**Tests del Backend (tests/api.test.js):**
```javascript
const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app)
                .get('/health')
                .expect(200);
            
            expect(res.body.status).toBe('OK');
        });
    });

    describe('GET /api/summoner/:region/:name', () => {
        it('should return summoner data for valid input', async () => {
            const res = await request(app)
                .get('/api/summoner/na1/TestPlayer')
                .expect(200);
            
            expect(res.body).toHaveProperty('summoner');
            expect(res.body).toHaveProperty('stats');
        });

        it('should return 404 for invalid summoner', async () => {
            await request(app)
                .get('/api/summoner/na1/NonExistentPlayer123456789')
                .expect(404);
        });
    });
});

describe('Database Service', () => {
    const database = require('../services/database');

    test('should save and retrieve summoner data', async () => {
        const mockSummoner = {
            puuid: 'test-puuid-' + Date.now(),
            id: 'test-id',
            accountId: 'test-account-id',
            name: 'TestPlayer',
            region: 'na1',
            summonerLevel: 100,
            profileIconId: 1,
            revisionDate: Date.now()
        };
        
        await database.saveSummoner(mockSummoner);
        const stats = await database.getPlayerStats(mockSummoner.puuid, 'na1', 10);
        
        expect(Array.isArray(stats)).toBe(true);
    });
});
```

#### Día 17-18: Deploy con MySQL

**Docker Compose para Desarrollo (docker-compose.dev.yml):**
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command: --default-authentication-plugin=mysql_native_password

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.dev
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - RIOT_API_KEY=${RIOT_API_KEY}
      - AI_API_KEY=${AI_API_KEY}
    ports:
      - "3001:3001"
    depends_on:
      - mysql
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  mysql_data:
```

**Dockerfile para Backend (backend/Dockerfile):**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio de logs
RUN mkdir -p logs

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicio
CMD ["npm", "start"]
```

**Script de Deploy para Railway:**
```bash
#!/bin/bash
# deploy-railway.sh

echo "🚀 Deploying to Railway..."

# Login a Railway
railway login

# Crear nuevo proyecto
railway new lol-analyzer-mvp

# Agregar MySQL
railway add mysql

# Configurar variables de entorno
railway variables set RIOT_API_KEY=$RIOT_API_KEY
railway variables set AI_API_KEY=$AI_API_KEY
railway variables set AI_API_PROVIDER=openai
railway variables set NODE_ENV=production

# Deploy backend
cd backend
railway up

echo "✅ Deploy completed!"
echo "📝 Don't forget to run migrations: railway run node scripts/migrate.js"
```

**Script de Migración para Producción (scripts/migrate.js):**
```javascript
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
    console.log('🔄 Running database migration...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        // Crear base de datos si no existe
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('✅ Database created/verified');
        
        await connection.execute(`USE ${process.env.DB_NAME}`);

        // Leer y ejecutar script SQL
        const sqlPath = path.join(__dirname, '..', 'init.sql');
        const sqlScript = await fs.readFile(sqlPath, 'utf8');
        
        // Dividir en statements individuales
        const statements = sqlScript
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            if (statement.toLowerCase().includes('create table') || 
                statement.toLowerCase().includes('create database') ||
                statement.toLowerCase().includes('use ')) {
                await connection.execute(statement);
                console.log('✅ Executed:', statement.split('\n')[0].substring(0, 50) + '...');
            }
        }

        console.log('🎉 Migration completed successfully');
        
        // Verificar tablas creadas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📊 Tables created:', tables.map(t => Object.values(t)[0]).join(', '));
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    runMigration().catch(process.exit);
}

module.exports = runMigration;
```

#### Día 19-20: Optimización y Monitoreo

**Configuración de Producción del Servidor (server.js):**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const database = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, searchLimiter } = require('./middleware/rateLimiter');

// Routes
const summonerRoutes = require('./routes/summoner');
const aiRoutes = require('./routes/ai');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// General middleware
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.vercel.app']
        : ['http://localhost:3000'],
    credentials: true
}));

app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(apiLimiter);

// Connect to database
database.connect().catch(err => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/summoner', searchLimiter, summonerRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    const server = app.listen();
    server.close(async () => {
        logger.info('HTTP server closed');
        await database.disconnect();
        process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
```

**Monitoreo y Health Checks (routes/health.js):**
```javascript
const express = require('express');
const router = express.Router();
const database = require('../config/database');
const riotAPI = require('../services/riotAPI');

router.get('/', async (req, res) => {
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        services: {}
    };

    // Check database
    try {
        await database.query('SELECT 1');
        healthCheck.services.database = { status: 'healthy', responseTime: Date.now() };
    } catch (error) {
        healthCheck.services.database = { status: 'unhealthy', error: error.message };
        healthCheck.status = 'DEGRADED';
    }

    // Check Riot API (simple ping)
    try {
        const start = Date.now();
        // Hacer una request simple a la API de Riot
        await riotAPI.getSummonerByName('na1', 'RiotSchmick'); // Cuenta oficial de Riot
        healthCheck.services.riotAPI = { 
            status: 'healthy', 
            responseTime: Date.now() - start 
        };
    } catch (error) {
        healthCheck.services.riotAPI = { 
            status: 'degraded', 
            note: 'May be rate limited or account not found' 
        };
    }

    const httpStatus = healthCheck.status === 'OK' ? 200 : 
                      healthCheck.status === 'DEGRADED' ? 503 : 500;

    res.status(httpStatus).json(healthCheck);
});

router.get('/metrics', (req, res) => {
    const metrics = {
        nodejs: {
            version: process.version,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            uptime: process.uptime()
        },
        system: {
            loadAverage: require('os').loadavg(),
            platform: require('os').platform(),
            arch: require('os').arch()
        }
    };

    res.json(metrics);
});

module.exports = router;
```

## 🚀 COMANDOS DE DEPLOY FINAL

**Para Development:**
```bash
# Setup inicial
git clone <your-repo>
cd lol-analyzer-mvp

# Backend setup
cd backend
npm install
cp .env.example .env
# Editar .env con tus API keys

# Base de datos local con Docker
docker-compose -f docker-compose.dev.yml up -d mysql
npm run migrate

# Iniciar backend
npm run dev

# Frontend setup (nueva terminal)
cd ../frontend
npm install
npm run dev
```

**Para Production Deploy:**
```bash
# Deploy Backend (Railway)
cd backend
railway login
railway new lol-analyzer-backend
railway add mysql
railway variables set RIOT_API_KEY=<your-key>
railway variables set AI_API_KEY=<your-key>
railway up
railway run node scripts/migrate.js

# Deploy Frontend (Vercel)
cd ../frontend
vercel --prod
# Configurar environment variables en Vercel dashboard
```

## ✅ CRITERIOS DE ÉXITO DEL MVP

- **Funcionalidad Básica**: ✅ Búsqueda de jugador y mostrar stats
- **IA Integrada**: ✅ Análisis personalizado funcionando
- **Base de Datos**: ✅ MySQL con esquema optimizado y migraciones
- **Performance**: ✅ < 3 segundos tiempo de carga inicial
- **Estabilidad**: ✅ Manejo robusto de errores y rate limiting
- **Escalabilidad**: ✅ Arquitectura preparada para evolucionar
- **Deploy**: ✅ Pipeline de deploy funcional
- **Monitoring**: ✅ Health checks y logging implementados

## 🔮 ROADMAP POST-MVP

**V2 (Semanas 5-6):**
- Implementar Redis para cache distribuido
- Agregar más regiones de Riot Games
- Mejorar análisis de IA con más contexto histórico
- Dashboard de administrador

**V3 (Semanas 7-8):**
- Análisis de meta actual en tiempo real
- Comparación con jugadores similares
- Recomendaciones de builds y runas

**V4 (Semanas 9-10):**
- Análisis básico de drafts (composiciones de equipo)
- Predicciones de win rate basadas en draft
- API para desarrolladores externos

**V5 (Semanas 11-12):**
- Analizador de drafts en tiempo real completo
- Integración con streaming platforms
- Sistema de notificaciones en tiempo real

## 📝 NOTAS IMPORTANTES

1. **API Keys**: Asegúrate de tener una Riot API key válida antes de empezar
2. **Rate Limits**: Respeta los rate limits de Riot API (100 requests/2min para development)
3. **Costos**: Monitorea los costos de AI API y base de datos
4. **Seguridad**: Nunca expongas las API keys en el frontend
5. **Testing**: Usa cuentas de prueba reales para validar funcionalidad
6. **Backup**: Implementa backups regulares de la base de datos en producción