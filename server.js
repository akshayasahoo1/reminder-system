'use strict';

require('dotenv').config();

const app = require('./app');
const logger = require('./src/utils/logger');
const { connectRedis } = require('./src/config/redis');
const { connectRabbitMQ } = require('./src/config/rabbitmq');
const { prisma } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// GRACEFUL SHUTDOWN HANDLER
// ─────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    logger.info('PostgreSQL disconnected.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─────────────────────────────────────────
// UNHANDLED REJECTIONS & EXCEPTIONS
// ─────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// ─────────────────────────────────────────
// BOOT SEQUENCE
// ─────────────────────────────────────────
const bootstrap = async () => {
  try {
    // 1. Verify database connection
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected via Prisma');

    // 2. Connect Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // 3. Connect RabbitMQ
    await connectRabbitMQ();
    logger.info('✅ RabbitMQ connected');

    // 4. Start HTTP server
    app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📋 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    logger.error('❌ Failed to bootstrap application:', err);
    process.exit(1);
  }
};

bootstrap();