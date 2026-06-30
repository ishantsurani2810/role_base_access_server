import mongoose from 'mongoose';
import { config } from './environment.js';
import logger from '../utils/logger.js';

const formatMongoUri = (uri) => {
  if (!uri) return uri;
  // Regex to extract protocol, username, password, host, and options/path
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^@/]+)(.*)$/);
  if (!match) return uri;

  const [_, protocol, username, password, host, rest] = match;
  
  // If the password is not already URL-encoded, encode it.
  const formattedPassword = decodeURIComponent(password) === password 
    ? encodeURIComponent(password) 
    : password;

  return `${protocol}${username}:${formattedPassword}@${host}${rest}`;
};

export const connectDatabase = async () => {
  try {
    const formattedUri = formatMongoUri(config.mongodbUri);
    const conn = await mongoose.connect(formattedUri, {
      maxPoolSize: 10,                  // max concurrent connections
      serverSelectionTimeoutMS: 10000,  // 10s to find a server
      socketTimeoutMS: 45000            // 45s before idle socket closes
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Register event listeners
    mongoose.connection.on('error', (err) => {
      logger.error(`Database runtime connection error: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected. Re-attempting connection...');
    });
  } catch (error) {
    logger.error(`Database startup connection failure: ${error.message}`);
    process.exit(1);
  }
};
