'use strict';

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// ─────────────────────────────────────────
// PRISMA SINGLETON
// Prevents multiple instances during hot-reload in dev
// ─────────────────────────────────────────
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: 'query',  emit: 'event' },
      { level: 'error',  emit: 'stdout' },
      { level: 'warn',   emit: 'stdout' },
    ],
  });

// Log slow queries in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    if (e.duration > 200) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };