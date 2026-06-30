import app from './app.js';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';

const startServer = async () => {
  // DB connection + seeding is handled lazily by the connectDatabase middleware
  // in app.js on the first request. This works on both traditional servers and
  // serverless platforms (Vercel) where listen() may not be called by the runtime.
  const server = app.listen(config.port, () => {
    logger.info(`=========================================`);
    logger.info(`SERVER RUNNING IN ${config.nodeEnv.toUpperCase()} MODE`);
    logger.info(`Listening on port: ${config.port}`);
    logger.info(`V1 Base Route: http://localhost:${config.port}/api/v1`);
    logger.info(`=========================================`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down server gracefully...');
    logger.error(`${err.name}: ${err.message}\nStack: ${err.stack}`);
    server.close(() => {
      process.exit(1);
    });
  });

  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down server gracefully...');
    logger.error(`${err.name}: ${err.message}\nStack: ${err.stack}`);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown for containerised environments (Docker, Kubernetes, Render, Railway)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Closing server gracefully...');
    server.close(() => {
      logger.info('Server closed. Exiting process.');
      process.exit(0);
    });
  });
};

startServer();
