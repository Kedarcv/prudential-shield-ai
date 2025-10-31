import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createServer } from 'http';
import WebSocket from 'ws';

import { connectDatabase } from './db/connection';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import riskRoutes from './routes/risk';
import complianceRoutes from './routes/compliance';
import alertRoutes from './routes/alerts';
import reportRoutes from './routes/reports';

import { RealTimeService } from './services/RealTimeService';
import { SchedulerService } from './services/SchedulerService';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize services
const realTimeService = new RealTimeService(wss);
const schedulerService = new SchedulerService();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/risk', authMiddleware, riskRoutes);
app.use('/api/compliance', authMiddleware, complianceRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      realTimeService.handleMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Start scheduler
    schedulerService.start();
    
    server.listen(PORT, () => {
      console.log(`🚀 RiskWise 2.0 API Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 WebSocket server running for real-time updates`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    schedulerService.stop();
    process.exit(0);
  });
});

startServer();