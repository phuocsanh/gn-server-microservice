const { createValidationError } = require('./errors');

/**
 * Validation utilities for chat service
 */

// Validation constants
const VALIDATION_RULES = {
  MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 5000
  },
  CONVERSATION: {
    MIN_PARTICIPANTS: 2,
    MAX_PARTICIPANTS: 100,
    NAME_MAX_LENGTH: 100
  },
  USER: {
    ID_MIN_LENGTH: 1,
    ID_MAX_LENGTH: 50,
    NAME_MAX_LENGTH: 100
  },
  FILE: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      VIDEO: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
      DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg']
    }
  }
};

// Basic validation functions
const isRequired = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
  return true;
};

const isString = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw createValidationError(`${fieldName} must be a string`, fieldName);
  }
  return true;
};

const isNumber = (value, fieldName) => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw createValidationError(`${fieldName} must be a valid number`, fieldName);
  }
  return true;
};

const isArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw createValidationError(`${fieldName} must be an array`, fieldName);
  }
  return true;
};

const isObject = (value, fieldName) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw createValidationError(`${fieldName} must be an object`, fieldName);
  }
  return true;
};

const isBoolean = (value, fieldName) => {
  if (typeof value !== 'boolean') {
    throw createValidationError(`${fieldName} must be a boolean`, fieldName);
  }
  return true;
};

// String validation
const validateLength = (value, fieldName, min = 0, max = Infinity) => {
  isString(value, fieldName);
  const length = value.trim().length;
  
  if (length < min) {
    throw createValidationError(`${fieldName} must be at least ${min} characters long`, fieldName);
  }
  
  if (length > max) {
    throw createValidationError(`${fieldName} must be no more than ${max} characters long`, fieldName);
  }
  
  return true;
};

const validateEmail = (email, fieldName = 'email') => {
  isRequired(email, fieldName);
  isString(email, fieldName);
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError(`${fieldName} must be a valid email address`, fieldName);
  }
  
  return true;
};

const validateUrl = (url, fieldName = 'url') => {
  isRequired(url, fieldName);
  isString(url, fieldName);
  
  try {
    new URL(url);
    return true;
  } catch {
    throw createValidationError(`${fieldName} must be a valid URL`, fieldName);
  }
};

// Array validation
const validateArrayLength = (array, fieldName, min = 0, max = Infinity) => {
  isArray(array, fieldName);
  
  if (array.length < min) {
    throw createValidationError(`${fieldName} must contain at least ${min} items`, fieldName);
  }
  
  if (array.length > max) {
    throw createValidationError(`${fieldName} must contain no more than ${max} items`, fieldName);
  }
  
  return true;
};

const validateUniqueArray = (array, fieldName) => {
  isArray(array, fieldName);
  
  const uniqueItems = new Set(array);
  if (uniqueItems.size !== array.length) {
    throw createValidationError(`${fieldName} must contain unique items`, fieldName);
  }
  
  return true;
};

// Enum validation
const validateEnum = (value, allowedValues, fieldName) => {
  isRequired(value, fieldName);
  
  if (!allowedValues.includes(value)) {
    throw createValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, fieldName);
  }
  
  return true;
};

// Chat-specific validations
const validateUserId = (userId, fieldName = 'userId') => {
  isRequired(userId, fieldName);
  isString(userId, fieldName);
  validateLength(userId, fieldName, VALIDATION_RULES.USER.ID_MIN_LENGTH, VALIDATION_RULES.USER.ID_MAX_LENGTH);
  return true;
};

const validateMessageContent = (content, fieldName = 'content') => {
  isRequired(content, fieldName);
  isString(content, fieldName);
  validateLength(content, fieldName, VALIDATION_RULES.MESSAGE.MIN_LENGTH, VALIDATION_RULES.MESSAGE.MAX_LENGTH);
  return true;
};

const validateMessageType = (type, fieldName = 'messageType') => {
  const allowedTypes = ['text', 'image', 'video', 'file', 'audio'];
  validateEnum(type, allowedTypes, fieldName);
  return true;
};

const validateConversationType = (type, fieldName = 'conversationType') => {
  const allowedTypes = ['direct', 'group'];
  validateEnum(type, allowedTypes, fieldName);
  return true;
};

const validateParticipants = (participants, fieldName = 'participants') => {
  isRequired(participants, fieldName);
  isArray(participants, fieldName);
  validateArrayLength(participants, fieldName, VALIDATION_RULES.CONVERSATION.MIN_PARTICIPANTS, VALIDATION_RULES.CONVERSATION.MAX_PARTICIPANTS);
  validateUniqueArray(participants, fieldName);
  
  // Validate each participant
  participants.forEach((participant, index) => {
    validateUserId(participant, `${fieldName}[${index}]`);
  });
  
  return true;
};

const validateConversationName = (name, fieldName = 'conversationName') => {
  if (name !== null && name !== undefined) {
    isString(name, fieldName);
    validateLength(name, fieldName, 1, VALIDATION_RULES.CONVERSATION.NAME_MAX_LENGTH);
  }
  return true;
};

const validateFileUpload = (file, fieldName = 'file') => {
  isRequired(file, fieldName);
  isObject(file, fieldName);
  
  // Validate file size
  if (file.size > VALIDATION_RULES.FILE.MAX_SIZE) {
    throw createValidationError(`${fieldName} size must be less than ${VALIDATION_RULES.FILE.MAX_SIZE / (1024 * 1024)}MB`, fieldName);
  }
  
  // Validate file type
  const allAllowedTypes = [
    ...VALIDATION_RULES.FILE.ALLOWED_TYPES.IMAGE,
    ...VALIDATION_RULES.FILE.ALLOWED_TYPES.VIDEO,
    ...VALIDATION_RULES.FILE.ALLOWED_TYPES.DOCUMENT,
    ...VALIDATION_RULES.FILE.ALLOWED_TYPES.AUDIO
  ];
  
  if (!allAllowedTypes.includes(file.mimetype)) {
    throw createValidationError(`${fieldName} type is not allowed. Allowed types: ${allAllowedTypes.join(', ')}`, fieldName);
  }
  
  return true;
};

const validatePagination = (page, limit, pageFieldName = 'page', limitFieldName = 'limit') => {
  if (page !== undefined) {
    isNumber(page, pageFieldName);
    if (page < 1) {
      throw createValidationError(`${pageFieldName} must be greater than 0`, pageFieldName);
    }
  }
  
  if (limit !== undefined) {
    isNumber(limit, limitFieldName);
    if (limit < 1 || limit > 100) {
      throw createValidationError(`${limitFieldName} must be between 1 and 100`, limitFieldName);
    }
  }
  
  return true;
};

// Composite validation functions
const validateCreateMessage = (data) => {
  const { conversationId, senderId, content, messageType = 'text', metadata } = data;
  
  validateUserId(conversationId, 'conversationId');
  validateUserId(senderId, 'senderId');
  validateMessageContent(content, 'content');
  validateMessageType(messageType, 'messageType');
  
  if (metadata !== undefined) {
    isObject(metadata, 'metadata');
  }
  
  return true;
};

const validateCreateConversation = (data) => {
  const { participants, type = 'direct', name, metadata } = data;
  
  validateParticipants(participants, 'participants');
  validateConversationType(type, 'type');
  
  if (name !== undefined) {
    validateConversationName(name, 'name');
  }
  
  if (metadata !== undefined) {
    isObject(metadata, 'metadata');
  }
  
  // Additional business logic validation
  if (type === 'direct' && participants.length !== 2) {
    throw createValidationError('Direct conversations must have exactly 2 participants', 'participants');
  }
  
  if (type === 'group' && participants.length < 3) {
    throw createValidationError('Group conversations must have at least 3 participants', 'participants');
  }
  
  return true;
};

const validateUpdateMessage = (data) => {
  const { content, status, metadata } = data;
  
  if (content !== undefined) {
    validateMessageContent(content, 'content');
  }
  
  if (status !== undefined) {
    const allowedStatuses = ['sent', 'delivered', 'read', 'deleted'];
    validateEnum(status, allowedStatuses, 'status');
  }
  
  if (metadata !== undefined) {
    isObject(metadata, 'metadata');
  }
  
  return true;
};

// Sanitization functions
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/\s+/g, ' ');
};

const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const sanitizeObject = (obj, allowedFields) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  allowedFields.forEach(field => {
    if (obj.hasOwnProperty(field)) {
      sanitized[field] = obj[field];
    }
  });
  
  return sanitized;
};

// Validation middleware
const validate = (validationFn) => {
  return (req, res, next) => {
    try {
      validationFn(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  // Basic validation
  isRequired,
  isString,
  isNumber,
  isArray,
  isObject,
  isBoolean,
  validateLength,
  validateEmail,
  validateUrl,
  validateArrayLength,
  validateUniqueArray,
  validateEnum,
  
  // Chat-specific validation
  validateUserId,
  validateMessageContent,
  validateMessageType,
  validateConversationType,
  validateParticipants,
  validateConversationName,
  validateFileUpload,
  validatePagination,
  
  // Composite validation
  validateCreateMessage,
  validateCreateConversation,
  validateUpdateMessage,
  
  // Sanitization
  sanitizeString,
  sanitizeHtml,
  sanitizeObject,
  
  // Middleware
  validate,
  
  // Constants
  VALIDATION_RULES
};
