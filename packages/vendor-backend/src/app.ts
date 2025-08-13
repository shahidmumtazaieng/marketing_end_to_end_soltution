/**
 * Vendor Backend Service
 * Handles: Order Management, Profile Management, Notifications, Referrals
 * Port: 3002
 * Base44 SDK Compatible
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Import shared services
import { DatabaseConnection } from '../../shared/database/connection';
import { authMiddleware } from '../../shared/auth/jwtService';
import { vendorRoleMiddleware } from './middleware/vendorAuth';

// Import vendor-specific routes
import orderRoutes from './routes/orders';
import profileRoutes from './routes/profile';
import notificationRoutes from './routes/notifications';
import referralRoutes from './routes/referrals';
import dashboardRoutes from './routes/dashboard';

// Load environment variables
config();

class VendorBackendApp {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.VENDOR_PORT || '3002');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: [
        process.env.VENDOR_APP_URL || 'http://localhost:3003', // Vendor web app
        'capacitor://localhost', // Capacitor mobile app
        'ionic://localhost',     // Ionic mobile app
        'http://localhost'       // Local development
      ],
      credentials: true
    }));

    // Rate limiting for vendor endpoints (more restrictive)
    const vendorRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // Moderate limit for vendor operations
      message: 'Too many requests from this IP for vendor operations'
    });
    this.app.use(vendorRateLimit);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' })); // Smaller limit for vendor operations
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[VENDOR] ${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Authentication middleware for all vendor routes
    this.app.use('/api/vendor', authMiddleware);
    this.app.use('/api/vendor', vendorRoleMiddleware);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        service: 'vendor-backend',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        base44_compatible: true
      });
    });

    // Vendor API routes (Base44 SDK compatible)
    this.app.use('/api/vendor/orders', orderRoutes);           // Order.list(), Order.update()
    this.app.use('/api/vendor/profile', profileRoutes);        // User.me(), User.updateMyUserData()
    this.app.use('/api/vendor/notifications', notificationRoutes);
    this.app.use('/api/vendor/referrals', referralRoutes);
    this.app.use('/api/vendor/dashboard', dashboardRoutes);

    // Base44 SDK compatibility endpoints
    this.app.get('/api/vendor/me', (req, res, next) => {
      // Redirect to profile endpoint for Base44 SDK compatibility
      req.url = '/api/vendor/profile';
      profileRoutes(req, res, next);
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Vendor endpoint not found',
        path: req.originalUrl,
        service: 'vendor-backend',
        base44_compatible: true
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(`[VENDOR ERROR] ${error.stack}`);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error in vendor backend',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        service: 'vendor-backend',
        timestamp: new Date().toISOString(),
        base44_compatible: true
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await DatabaseConnection.initialize();
      console.log('✅ Vendor Backend: Database connected');

      // Start server
      this.app.listen(this.port, () => {
        console.log(`🚀 Vendor Backend Server running on port ${this.port}`);
        console.log(`📱 Vendor Services Available (Base44 SDK Compatible):`);
        console.log(`   • Orders: http://localhost:${this.port}/api/vendor/orders`);
        console.log(`   • Profile: http://localhost:${this.port}/api/vendor/profile`);
        console.log(`   • Notifications: http://localhost:${this.port}/api/vendor/notifications`);
        console.log(`   • Referrals: http://localhost:${this.port}/api/vendor/referrals`);
        console.log(`   • Dashboard: http://localhost:${this.port}/api/vendor/dashboard`);
        console.log(`   • Base44 SDK: http://localhost:${this.port}/api/vendor/me`);
      });

    } catch (error) {
      console.error('❌ Vendor Backend: Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await DatabaseConnection.close();
      console.log('✅ Vendor Backend: Database connection closed');
    } catch (error) {
      console.error('❌ Vendor Backend: Error closing database connection:', error);
    }
  }
}

// Create and start vendor backend
const vendorBackend = new VendorBackendApp();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Vendor Backend: Received SIGTERM, shutting down gracefully');
  await vendorBackend.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Vendor Backend: Received SIGINT, shutting down gracefully');
  await vendorBackend.stop();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  vendorBackend.start().catch(error => {
    console.error('❌ Vendor Backend: Fatal error during startup:', error);
    process.exit(1);
  });
}

export default vendorBackend;
