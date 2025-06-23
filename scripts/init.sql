-- Create database if it doesn't exist
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
    team_id INT DEFAULT 0,
    position VARCHAR(20),
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    assists INT DEFAULT 0,
    total_damage_dealt_to_champions INT DEFAULT 0,
    vision_score INT DEFAULT 0,
    gold_earned INT DEFAULT 0,
    total_minions_killed INT DEFAULT 0,
    item0 INT DEFAULT 0,
    item1 INT DEFAULT 0,
    item2 INT DEFAULT 0,
    item3 INT DEFAULT 0,
    item4 INT DEFAULT 0,
    item5 INT DEFAULT 0,
    item6 INT DEFAULT 0,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
