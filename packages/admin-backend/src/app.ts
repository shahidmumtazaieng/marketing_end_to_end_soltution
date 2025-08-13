/**
 * Admin Backend Service
 * Handles: Data Scraper, Calling Agents, Vendor Selection, Conversations, API Configs
 * Port: 3001
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Import shared services
import { DatabaseConnection } from '../../shared/database/connection';
import { authMiddleware } from '../../shared/auth/jwtService';
import { adminRoleMiddleware } from './middleware/adminAuth';

// Import admin-specific routes
import conversationRoutes from './routes/conversations';
import vendorSelectionRoutes from './routes/vendor-selection';
import dataScraperRoutes from './routes/data-scraper';
import callingAgentRoutes from './routes/calling-agents';
import apiConfigRoutes from './routes/api-configs';
import analyticsRoutes from './routes/analytics';

// Load environment variables
config();

class AdminBackendApp {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.ADMIN_PORT || '3001');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Rate limiting for admin endpoints
    const adminRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Higher limit for admin operations
      message: 'Too many requests from this IP for admin operations'
    });
    this.app.use(adminRateLimit);

    // Body parsing
    this.app.use(express.json({ limit: '50mb' })); // Larger limit for data scraper
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[ADMIN] ${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Authentication middleware for all admin routes
    this.app.use('/api/admin', authMiddleware);
    this.app.use('/api/admin', adminRoleMiddleware);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        service: 'admin-backend',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Admin API routes
    this.app.use('/api/admin/conversations', conversationRoutes);
    this.app.use('/api/admin/vendor-selection', vendorSelectionRoutes);
    this.app.use('/api/admin/data-scraper', dataScraperRoutes);
    this.app.use('/api/admin/calling-agents', callingAgentRoutes);
    this.app.use('/api/admin/api-configs', apiConfigRoutes);
    this.app.use('/api/admin/analytics', analyticsRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Admin endpoint not found',
        path: req.originalUrl,
        service: 'admin-backend'
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(`[ADMIN ERROR] ${error.stack}`);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error in admin backend',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        service: 'admin-backend',
        timestamp: new Date().toISOString()
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await DatabaseConnection.initialize();
      console.log('✅ Admin Backend: Database connected');

      // Start server
      this.app.listen(this.port, () => {
        console.log(`🚀 Admin Backend Server running on port ${this.port}`);
        console.log(`📊 Admin Services Available:`);
        console.log(`   • Data Scraper: http://localhost:${this.port}/api/admin/data-scraper`);
        console.log(`   • Calling Agents: http://localhost:${this.port}/api/admin/calling-agents`);
        console.log(`   • Vendor Selection: http://localhost:${this.port}/api/admin/vendor-selection`);
        console.log(`   • Conversations: http://localhost:${this.port}/api/admin/conversations`);
        console.log(`   • API Configs: http://localhost:${this.port}/api/admin/api-configs`);
        console.log(`   • Analytics: http://localhost:${this.port}/api/admin/analytics`);
      });

    } catch (error) {
      console.error('❌ Admin Backend: Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await DatabaseConnection.close();
      console.log('✅ Admin Backend: Database connection closed');
    } catch (error) {
      console.error('❌ Admin Backend: Error closing database connection:', error);
    }
  }
}

// Create and start admin backend
const adminBackend = new AdminBackendApp();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Admin Backend: Received SIGTERM, shutting down gracefully');
  await adminBackend.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Admin Backend: Received SIGINT, shutting down gracefully');
  await adminBackend.stop();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  adminBackend.start().catch(error => {
    console.error('❌ Admin Backend: Fatal error during startup:', error);
    process.exit(1);
  });
}

export default adminBackend;
