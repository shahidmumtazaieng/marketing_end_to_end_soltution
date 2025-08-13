/**
 * Shared Database Connection
 * Used by both Admin Backend and Vendor Backend
 * Supports PostgreSQL, MongoDB, and other databases
 */

import { config } from 'dotenv';

// Load environment variables
config();

export interface DatabaseConfig {
  type: 'postgresql' | 'mongodb' | 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
  connectionTimeout?: number;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: any = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      type: (process.env.DATABASE_TYPE as any) || 'postgresql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'saas_platform',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      ssl: process.env.DATABASE_SSL === 'true',
      poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
      connectionTimeout: parseInt(process.env.DATABASE_TIMEOUT || '30000')
    };
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async initialize(): Promise<void> {
    try {
      console.log(`🔌 Connecting to ${this.config.type} database...`);
      
      switch (this.config.type) {
        case 'postgresql':
          await this.initializePostgreSQL();
          break;
        case 'mongodb':
          await this.initializeMongoDB();
          break;
        case 'mysql':
          await this.initializeMySQL();
          break;
        default:
          throw new Error(`Unsupported database type: ${this.config.type}`);
      }

      console.log(`✅ Database connected successfully (${this.config.type})`);
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private async initializePostgreSQL(): Promise<void> {
    // PostgreSQL connection using pg or TypeORM
    const { Pool } = require('pg');
    
    this.connection = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.poolSize,
      connectionTimeoutMillis: this.config.connectionTimeout,
      idleTimeoutMillis: 30000,
      query_timeout: 60000
    });

    // Test connection
    const client = await this.connection.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log('✅ PostgreSQL connection pool created');
  }

  private async initializeMongoDB(): Promise<void> {
    // MongoDB connection using mongoose
    const mongoose = require('mongoose');
    
    const connectionString = `mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
    
    this.connection = await mongoose.connect(connectionString, {
      maxPoolSize: this.config.poolSize,
      serverSelectionTimeoutMS: this.config.connectionTimeout,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    console.log('✅ MongoDB connection established');
  }

  private async initializeMySQL(): Promise<void> {
    // MySQL connection using mysql2
    const mysql = require('mysql2/promise');
    
    this.connection = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      connectionLimit: this.config.poolSize,
      acquireTimeout: this.config.connectionTimeout,
      timeout: 60000,
      reconnect: true
    });

    // Test connection
    const connection = await this.connection.getConnection();
    await connection.ping();
    connection.release();

    console.log('✅ MySQL connection pool created');
  }

  public getConnection(): any {
    if (!this.connection) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.connection;
  }

  public async query(sql: string, params: any[] = []): Promise<any> {
    try {
      switch (this.config.type) {
        case 'postgresql':
          const pgResult = await this.connection.query(sql, params);
          return pgResult.rows;
          
        case 'mysql':
          const [mysqlRows] = await this.connection.execute(sql, params);
          return mysqlRows;
          
        case 'mongodb':
          // For MongoDB, this would be handled differently
          throw new Error('Use MongoDB models for queries');
          
        default:
          throw new Error(`Query not supported for ${this.config.type}`);
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    if (this.config.type === 'postgresql') {
      const client = await this.connection.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else if (this.config.type === 'mysql') {
      const connection = await this.connection.getConnection();
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
    } else {
      throw new Error(`Transactions not implemented for ${this.config.type}`);
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.connection) {
        switch (this.config.type) {
          case 'postgresql':
            await this.connection.end();
            break;
          case 'mongodb':
            await this.connection.disconnect();
            break;
          case 'mysql':
            await this.connection.end();
            break;
        }
        this.connection = null;
        console.log(`✅ Database connection closed (${this.config.type})`);
      }
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      switch (this.config.type) {
        case 'postgresql':
          const pgClient = await this.connection.connect();
          await pgClient.query('SELECT 1');
          pgClient.release();
          return true;
          
        case 'mysql':
          const mysqlConnection = await this.connection.getConnection();
          await mysqlConnection.ping();
          mysqlConnection.release();
          return true;
          
        case 'mongodb':
          return this.connection.readyState === 1;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config, password: '***' }; // Hide password in logs
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();
