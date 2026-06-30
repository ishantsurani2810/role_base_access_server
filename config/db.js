import mongoose from 'mongoose';
import { config } from './environment.js';
import logger from '../utils/logger.js';

const formatMongoUri = (uri) => {
  if (!uri) return uri;
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^@/]+)(.*)$/);
  if (!match) return uri;
  const [_, protocol, username, password, host, rest] = match;
  const formattedPassword = decodeURIComponent(password) === password
    ? encodeURIComponent(password)
    : password;
  return `${protocol}${username}:${formattedPassword}@${host}${rest}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Serverless-safe connection helper.
//
// On platforms like Vercel each function invocation may reuse the same Node.js
// module cache (warm start) OR get a brand-new cold container.  We must NOT
// call mongoose.connect() again when a connection already exists, because that
// creates duplicate connections and causes buffering timeouts.
//
// The cached `connectionPromise` means concurrent in-flight requests on a cold
// start all await the same single connection attempt instead of each racing to
// open their own.
// ─────────────────────────────────────────────────────────────────────────────
let connectionPromise = null;
let seeded = false;

export const connectDatabase = async () => {
  // Already connected — reuse the live connection.
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection is in progress (another concurrent request on cold start) — wait for it.
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  // Cold start — open a new connection and cache the promise.
  connectionPromise = (async () => {
    try {
      const formattedUri = formatMongoUri(config.mongodbUri);
      const conn = await mongoose.connect(formattedUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        // bufferCommands must be true so Mongoose queues ops until connected
        bufferCommands: true
      });
      logger.info(`MongoDB Connected: ${conn.connection.host}`);

      // Run seeding once per cold start after the connection is established
      if (!seeded) {
        seeded = true;
        // Lazy import to avoid circular dependency at module load time
        const { seedRolesAndAdminAccount } = await import('../services/user.service.js');
        await seedRolesAndAdminAccount();
      }

      mongoose.connection.on('error', (err) => {
        logger.error(`Database runtime connection error: ${err.message}`);
        // Reset so the next request triggers a fresh connect attempt.
        connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('Database disconnected. Will reconnect on next request.');
        connectionPromise = null;
        seeded = false;
      });
    } catch (error) {
      connectionPromise = null; // Allow retry on next request
      logger.error(`Database connection failure: ${error.message}`);
      throw error; // Propagate so the request returns a 500 instead of hanging
    }
  })();

  await connectionPromise;
};
