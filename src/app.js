import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { config } from '../config/environment.js';
import apiRouter from '../routes/index.js';
import { globalErrorHandler } from '../middlewares/error.middleware.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS with custom allowed origin configuration
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Morgan request logger integration
const morganFormat = config.nodeEnv === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.debug(message.trim()) }
}));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', generalLimiter);

// API Version Mount
app.use('/api/v1', apiRouter);

// Health check endpoint for deployment platforms (Vercel, Render, Railway, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Catch-all for unhandled routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found on this server.`));
});

// Central Error Interception Middleware
app.use(globalErrorHandler);

export default app;
