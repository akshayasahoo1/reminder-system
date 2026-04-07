'use strict';

const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

/**
 * Connect to Redis and store the client as a singleton.
 * Call once at application boot in server.js.
 */
const connectRedis = async () => {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis: max reconnect attempts reached.');
          return new Error('Redis max retries exceeded');
        }
        return Math.min(retries * 100, 3000); // exponential backoff, max 3s
      },
    },
  });

  redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
  redisClient.on('reconnecting', () => logger.warn('Redis: reconnecting...'));
  redisClient.on('ready', () => logger.info('Redis: connection ready'));

  await redisClient.connect();
  return redisClient;
};

/**
 * Returns the active Redis client.
 * Throws if called before connectRedis().
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };