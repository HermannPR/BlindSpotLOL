-- Migration script to add missing columns
USE lol_analyzer;

-- Add team_id column to match_participants if it doesn't exist
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA='lol_analyzer' AND TABLE_NAME='match_participants' AND COLUMN_NAME='team_id') = 0,
  'ALTER TABLE match_participants ADD COLUMN team_id INT DEFAULT 0 AFTER champion_name',
  'SELECT "team_id column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add individual item columns to match_participants if they don't exist
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA='lol_analyzer' AND TABLE_NAME='match_participants' AND COLUMN_NAME='item0') = 0,
  'ALTER TABLE match_participants ADD COLUMN item0 INT DEFAULT 0 AFTER total_minions_killed, ADD COLUMN item1 INT DEFAULT 0 AFTER item0, ADD COLUMN item2 INT DEFAULT 0 AFTER item1, ADD COLUMN item3 INT DEFAULT 0 AFTER item2, ADD COLUMN item4 INT DEFAULT 0 AFTER item3, ADD COLUMN item5 INT DEFAULT 0 AFTER item4, ADD COLUMN item6 INT DEFAULT 0 AFTER item5',
  'SELECT "item columns already exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add updated_at column to ai_analysis if it doesn't exist
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA='lol_analyzer' AND TABLE_NAME='ai_analysis' AND COLUMN_NAME='updated_at') = 0,
  'ALTER TABLE ai_analysis ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
  'SELECT "updated_at column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show table structures to verify changes
SELECT 'match_participants table structure:' as info;
DESCRIBE match_participants;

SELECT 'ai_analysis table structure:' as info;
DESCRIBE ai_analysis;
