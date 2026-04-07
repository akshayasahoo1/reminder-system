'use strict';

const amqplib = require('amqplib');
const logger = require('../utils/logger');

let connection = null;
let channel = null;

const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'reminder_queue';

/**
 * Connect to RabbitMQ and assert the queue.
 * Call once at application boot in server.js.
 */
const connectRabbitMQ = async () => {
  const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

  connection = await amqplib.connect(url);
  channel = await connection.createChannel();

  // durable: true → queue survives broker restarts
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  logger.info(`RabbitMQ: queue "${QUEUE_NAME}" asserted`);

  // Handle unexpected connection close
  connection.on('close', () => {
    logger.warn('RabbitMQ connection closed. Attempting reconnect in 5s...');
    setTimeout(connectRabbitMQ, 5000);
  });

  connection.on('error', (err) => {
    logger.error('RabbitMQ connection error:', err.message);
  });

  return { connection, channel };
};

/**
 * Returns the active RabbitMQ channel.
 * Throws if called before connectRabbitMQ().
 */
const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ() first.');
  }
  return channel;
};

const getQueueName = () => QUEUE_NAME;

module.exports = { connectRabbitMQ, getChannel, getQueueName };