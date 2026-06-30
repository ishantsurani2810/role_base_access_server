import app from './app.js';
import { config } from '../config/environment.js';
import { connectDatabase } from '../config/db.js';
import { seedRolesAndAdminAccount } from '../services/user.service.js';
import logger from '../utils/logger.js';

const startServer = async () => {
  // 1. Establish database connection
  await connectDatabase();

  // 2. Perform database seeding (roles, root admin)
  await seedRolesAndAdminAccount();

  // 3. Hear on configured port
  const server = app.listen(config.port, () => {
    logger.info(`=========================================`);
    logger.info(`SERVER RUNNING IN ${config.nodeEnv.toUpperCase()} MODE`);
    logger.info(`Listening on port: ${config.port}`);
    logger.info(`V1 Base Route: http://localhost:${config.port}/api/v1`);
    logger.info(`=========================================`);
  });

  // Handle uncaught exceptions and rejections
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
};

startServer();
