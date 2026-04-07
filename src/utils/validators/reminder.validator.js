'use strict';

const Joi = require('joi');

const createReminderSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required().messages({
    'string.min': 'Title cannot be empty',
    'string.max': 'Title cannot exceed 255 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().trim().max(1000).optional().allow(''),
  scheduledTime: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Scheduled time must be in the future',
    'any.required': 'Scheduled time is required',
  }),
});

const updateReminderSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional(),
  description: Joi.string().trim().max(1000).optional().allow(''),
  scheduledTime: Joi.date().iso().greater('now').optional().messages({
    'date.greater': 'Scheduled time must be in the future',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

module.exports = { createReminderSchema, updateReminderSchema };