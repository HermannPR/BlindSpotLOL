import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations and utilities
import { connectDatabase } from './config/database';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, searchLimiter } from './middleware/rateLimiter';

// Import routes
import healthRoutes from './routes/health';
import summonerRoutes from './routes/summoner';
import aiRoutes from './routes/ai';

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
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(apiLimiter);

// Connect to database
connectDatabase().catch(err => {
  logger.error('Failed to connect to database:', err);
  logger.warn('Server will continue without database connection');
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
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const server = app.listen(PORT, () => {
  logger.info(`🚀 LOL Analyzer MVP Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🧠 AI Analysis endpoints available at http://localhost:${PORT}/api/ai`);
});

export default app;
