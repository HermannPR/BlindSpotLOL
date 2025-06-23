import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'lol_analyzer',
  };

  console.log('📊 Database config:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    password: config.password ? '***' : 'empty'
  });

  try {
    // Test connection without database first
    const connectionWithoutDB = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });

    console.log('✅ MySQL connection successful');    // Check if database exists
    const [databases]: [any[], any] = await connectionWithoutDB.execute(
      `SHOW DATABASES LIKE '${config.database}'`
    );

    if ((databases as any[]).length === 0) {
      console.log('📂 Database does not exist, creating...');
      await connectionWithoutDB.execute(`CREATE DATABASE ${config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database exists');
    }

    await connectionWithoutDB.end();

    // Test connection with database
    const connection = await mysql.createConnection(config);
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test successful');

    // Check tables
    const [tables]: [any[], any] = await connection.execute('SHOW TABLES');
    const tableList = tables as any[];
    console.log('📋 Tables found:', tableList.map((row: any) => Object.values(row)[0]));

    // Check specific table structures
    if (tableList.length > 0) {
      try {
        const [matchParticipants]: [any[], any] = await connection.execute('DESCRIBE match_participants');
        console.log('📊 match_participants columns:', (matchParticipants as any[]).map((row: any) => row.Field));
        
        const [aiAnalysis]: [any[], any] = await connection.execute('DESCRIBE ai_analysis');
        console.log('📊 ai_analysis columns:', (aiAnalysis as any[]).map((row: any) => row.Field));
      } catch (error) {
        console.log('⚠️  Some tables may not exist yet');
      }
    }

    await connection.end();
    console.log('✅ All database tests passed!');
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔑 Suggestions:');
      console.log('   1. Check MySQL username and password');
      console.log('   2. Make sure MySQL is running');
      console.log('   3. Try: mysql -u root -p');
      console.log('   4. Grant permissions: GRANT ALL PRIVILEGES ON *.* TO \'root\'@\'localhost\';');
    }
    
    process.exit(1);
  }
}

testDatabaseConnection();
