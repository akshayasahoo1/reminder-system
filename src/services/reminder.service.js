'use strict';

const ReminderModel = require('../models/reminder.model');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { getChannel, getQueueName } = require('../config/rabbitmq');
const { getRedisClient } = require('../config/redis');

const CACHE_TTL = parseInt(process.env.REDIS_TTL, 10) || 3600;

/**
 * Build a per-user Redis cache key.
 * @param {string} userId
 */
const cacheKey = (userId) => `reminders:user:${userId}`;

/**
 * Reminder Service
 * All business logic for reminder CRUD + queue publishing + cache management.
 */
const ReminderService = {
  /**
   * Create a new reminder.
   * - Saves to DB
   * - Publishes message to RabbitMQ
   * - Invalidates user's reminder cache
   *
   * @param {string} userId
   * @param {{ title, description, scheduledTime }} data
   * @returns {Promise<Reminder>}
   */
  create: async (userId, { title, description, scheduledTime }) => {
    // 1. Save to database
    const reminder = await ReminderModel.create({
      userId,
      title,
      description,
      scheduledTime,
    });

    logger.info(`Reminder created: ${reminder.id} for user ${userId}`);

    // 2. Publish to RabbitMQ queue
    try {
      const channel = getChannel();
      const queueName = getQueueName();

      const message = {
        reminderId: reminder.id,
        scheduledTime: reminder.scheduledTime,
      };

      // persistent: true → message survives broker restart
      channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      logger.info(`Reminder ${reminder.id} pushed to queue "${queueName}"`);
    } catch (err) {
      // Queue failure should NOT fail the API — log and continue
      logger.error(`Failed to push reminder ${reminder.id} to queue:`, err.message);
    }

    // 3. Invalidate cache so next GET fetches fresh data
    try {
      const redis = getRedisClient();
      await redis.del(cacheKey(userId));
    } catch (err) {
      logger.warn(`Cache invalidation failed for user ${userId}:`, err.message);
    }

    return reminder;
  },

  /**
   * Get all reminders for a user.
   * - Checks Redis cache first
   * - Falls back to DB on cache miss
   * - Supports status filter and pagination
   *
   * @param {string} userId
   * @param {{ status?, page?, limit? }} options
   * @returns {Promise<{ reminders, total, page, limit }>}
   */
  getAll: async (userId, options = {}) => {
    const { status, page = 1, limit = 20 } = options;

    // Only cache the default (no filters) first page
    const isCacheable = !status && page === 1;
    const key = cacheKey(userId);

    if (isCacheable) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(key);
        if (cached) {
          logger.info(`Cache HIT for user ${userId}`);
          return JSON.parse(cached);
        }
        logger.info(`Cache MISS for user ${userId}`);
      } catch (err) {
        logger.warn('Redis read failed, falling back to DB:', err.message);
      }
    }

    // Fetch from database
    const { reminders, total } = await ReminderModel.findAllByUser(userId, {
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    const result = {
      reminders,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    // Store in cache (only for default query)
    if (isCacheable) {
      try {
        const redis = getRedisClient();
        await redis.setEx(key, CACHE_TTL, JSON.stringify(result));
      } catch (err) {
        logger.warn('Redis write failed:', err.message);
      }
    }

    return result;
  },

  /**
   * Get a single reminder by ID (ownership enforced).
   *
   * @param {string} reminderId
   * @param {string} userId
   * @returns {Promise<Reminder>}
   */
  getOne: async (reminderId, userId) => {
    const reminder = await ReminderModel.findByIdAndUser(reminderId, userId);

    if (!reminder) {
      throw new AppError('Reminder not found', 404, 'NOT_FOUND');
    }

    return reminder;
  },

  /**
   * Update a reminder (ownership enforced).
   * - Invalidates cache on success
   *
   * @param {string} reminderId
   * @param {string} userId
   * @param {{ title?, description?, scheduledTime? }} data
   * @returns {Promise<Reminder>}
   */
  update: async (reminderId, userId, data) => {
    // 1. Confirm ownership
    const existing = await ReminderModel.findByIdAndUser(reminderId, userId);
    if (!existing) {
      throw new AppError('Reminder not found', 404, 'NOT_FOUND');
    }

    // 2. Cannot update an already-sent reminder
    if (existing.status === 'SENT') {
      throw new AppError('Cannot update a reminder that has already been sent', 400, 'ALREADY_SENT');
    }

    // 3. Update in DB
    const updated = await ReminderModel.update(reminderId, data);
    logger.info(`Reminder updated: ${reminderId} by user ${userId}`);

    // 4. Invalidate cache
    try {
      const redis = getRedisClient();
      await redis.del(cacheKey(userId));
    } catch (err) {
      logger.warn(`Cache invalidation failed for user ${userId}:`, err.message);
    }

    return updated;
  },

  /**
   * Delete a reminder (ownership enforced).
   * - Invalidates cache on success
   *
   * @param {string} reminderId
   * @param {string} userId
   * @returns {Promise<void>}
   */
  delete: async (reminderId, userId) => {
    // 1. Confirm ownership
    const existing = await ReminderModel.findByIdAndUser(reminderId, userId);
    if (!existing) {
      throw new AppError('Reminder not found', 404, 'NOT_FOUND');
    }

    // 2. Delete from DB
    await ReminderModel.delete(reminderId);
    logger.info(`Reminder deleted: ${reminderId} by user ${userId}`);

    // 3. Invalidate cache
    try {
      const redis = getRedisClient();
      await redis.del(cacheKey(userId));
    } catch (err) {
      logger.warn(`Cache invalidation failed for user ${userId}:`, err.message);
    }
  },
};

module.exports = ReminderService;