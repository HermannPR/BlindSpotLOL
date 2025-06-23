import mysql from 'mysql2/promise';
import logger from '../utils/logger';

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lol_analyzer',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      this.isConnected = true;
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      logger.error('Database query error:', { sql, params, error });
      throw error;
    }
  }

  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

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

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }
}

const databaseManager = new DatabaseManager();

export const connectDatabase = () => databaseManager.connect();
export const query = (sql: string, params?: any[]) => databaseManager.query(sql, params);
export const transaction = <T>(callback: (connection: mysql.PoolConnection) => Promise<T>) => 
  databaseManager.transaction(callback);
export const closeDatabase = () => databaseManager.close();

export default databaseManager;
