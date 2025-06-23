import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration(): Promise<void> {
  console.log('🔄 Running database migration...');
  
  let connection: mysql.Connection | null = null;
  
  try {
    // Connect to MySQL without specifying database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('📡 Connected to MySQL server');    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', '..', '..', 'scripts', 'init.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Split SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('✅ Migration completed successfully!');
      // Test the final connection to the database
    await connection.query(`USE ${process.env.DB_NAME || 'lol_analyzer'}`);
    const [rows] = await connection.query('SHOW TABLES');
    console.log('📋 Tables created:', rows);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

if (require.main === module) {
  runMigration().catch(() => process.exit(1));
}

export default runMigration;
