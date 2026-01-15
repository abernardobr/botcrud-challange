/**
 * XSS Sanitization Module
 * Provides text sanitization to prevent Cross-Site Scripting (XSS) attacks
 */

'use strict';

/**
 * HTML entities that need to be escaped
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Regex pattern to match HTML entities
 */
const HTML_ENTITIES_REGEX = /[&<>"'`=/]/g;

/**
 * Dangerous patterns that should be removed or escaped
 */
const DANGEROUS_PATTERNS = [
  // Script tags
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // Event handlers
  /\bon\w+\s*=/gi,
  // JavaScript URLs
  /javascript:/gi,
  // Data URLs with scripts
  /data:\s*text\/html/gi,
  // VBScript
  /vbscript:/gi,
  // Expression (IE)
  /expression\s*\(/gi,
];

/**
 * Sanitizer class providing XSS protection utilities
 */
class Sanitizer {
  /**
   * Escape HTML entities in a string
   * This is the primary method for preventing XSS
   *
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  static escapeHtml(str) {
    if (typeof str !== 'string') {
      return str;
    }
    return str.replace(HTML_ENTITIES_REGEX, (char) => HTML_ENTITIES[char]);
  }

  /**
   * Remove dangerous HTML/script patterns from a string
   *
   * @param {string} str - String to clean
   * @returns {string} Cleaned string
   */
  static stripDangerousPatterns(str) {
    if (typeof str !== 'string') {
      return str;
    }

    let result = str;
    for (const pattern of DANGEROUS_PATTERNS) {
      result = result.replace(pattern, '');
    }
    return result;
  }

  /**
   * Sanitize a string for safe storage and display
   * Combines escaping and pattern removal
   *
   * @param {string} str - String to sanitize
   * @param {Object} options - Sanitization options
   * @param {boolean} options.escapeHtml - Whether to escape HTML entities (default: true)
   * @param {boolean} options.stripDangerous - Whether to strip dangerous patterns (default: true)
   * @param {boolean} options.trim - Whether to trim whitespace (default: true)
   * @returns {string} Sanitized string
   */
  static sanitizeString(str, options = {}) {
    const {
      escapeHtml = true,
      stripDangerous = true,
      trim = true,
    } = options;

    if (typeof str !== 'string') {
      return str;
    }

    let result = str;

    // Trim whitespace
    if (trim) {
      result = result.trim();
    }

    // Strip dangerous patterns first
    if (stripDangerous) {
      result = this.stripDangerousPatterns(result);
    }

    // Escape HTML entities
    if (escapeHtml) {
      result = this.escapeHtml(result);
    }

    return result;
  }

  /**
   * Sanitize an object's string properties recursively
   *
   * @param {Object} obj - Object to sanitize
   * @param {Object} options - Sanitization options
   * @param {string[]} options.fields - Specific fields to sanitize (if not provided, all string fields are sanitized)
   * @param {string[]} options.exclude - Fields to exclude from sanitization
   * @param {number} options.maxDepth - Maximum recursion depth (default: 5)
   * @returns {Object} Sanitized object
   */
  static sanitizeObject(obj, options = {}) {
    const {
      fields = null,
      exclude = [],
      maxDepth = 5,
    } = options;

    const sanitize = (value, depth = 0) => {
      // Prevent infinite recursion
      if (depth > maxDepth) {
        return value;
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return value;
      }

      // Handle strings
      if (typeof value === 'string') {
        return this.sanitizeString(value);
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map((item) => sanitize(item, depth + 1));
      }

      // Handle Date objects
      if (value instanceof Date) {
        return value;
      }

      // Handle plain objects
      if (typeof value === 'object') {
        const result = {};

        for (const key of Object.keys(value)) {
          // Skip excluded fields
          if (exclude.includes(key)) {
            result[key] = value[key];
            continue;
          }

          // If specific fields are specified, only sanitize those
          if (fields !== null && !fields.includes(key)) {
            result[key] = value[key];
            continue;
          }

          result[key] = sanitize(value[key], depth + 1);
        }

        return result;
      }

      // Return primitives as-is
      return value;
    };

    return sanitize(obj, 0);
  }

  /**
   * Sanitize request payload
   * Convenience method for controller use
   *
   * @param {Object} payload - Request payload to sanitize
   * @param {string[]} textFields - Fields that should be treated as text (sanitized)
   * @returns {Object} Sanitized payload
   */
  static sanitizePayload(payload, textFields = []) {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const result = { ...payload };

    for (const field of textFields) {
      if (field in result && typeof result[field] === 'string') {
        result[field] = this.sanitizeString(result[field]);
      }
    }

    return result;
  }

  /**
   * Create a Joi custom validator for sanitized strings
   * Use this to extend Joi schemas with automatic sanitization
   *
   * @param {Object} Joi - Joi instance
   * @returns {Object} Extended Joi with sanitizedString type
   */
  static extendJoi(Joi) {
    return Joi.extend((joi) => ({
      type: 'sanitizedString',
      base: joi.string(),
      messages: {
        'sanitizedString.dangerous': '{{#label}} contains potentially dangerous content',
      },
      coerce(value, helpers) {
        if (typeof value !== 'string') {
          return { value };
        }

        // Check for dangerous patterns before sanitizing
        for (const pattern of DANGEROUS_PATTERNS) {
          if (pattern.test(value)) {
            // Reset regex lastIndex
            pattern.lastIndex = 0;
            return { value: Sanitizer.sanitizeString(value) };
          }
        }

        // Always sanitize to escape HTML entities
        return { value: Sanitizer.sanitizeString(value) };
      },
    }));
  }
}

/**
 * Hapi plugin for automatic payload sanitization
 * Registers as onPreHandler to sanitize payloads before they reach controllers
 */
const sanitizerPlugin = {
  name: 'sanitizer',
  version: '1.0.0',
  register: async (server, options = {}) => {
    const {
      textFields = ['name', 'description', 'message'],
      exclude = [],
    } = options;

    server.ext('onPreHandler', (request, h) => {
      // Only process requests with payloads
      if (request.payload && typeof request.payload === 'object') {
        // Skip excluded routes
        const routeSettings = request.route.settings.plugins?.sanitizer || {};
        if (routeSettings.skip) {
          return h.continue;
        }

        // Get fields to sanitize from route settings or use defaults
        const fieldsToSanitize = routeSettings.fields || textFields;
        const fieldsToExclude = [...exclude, ...(routeSettings.exclude || [])];

        // Sanitize payload
        request.payload = Sanitizer.sanitizePayload(
          request.payload,
          fieldsToSanitize.filter((f) => !fieldsToExclude.includes(f)),
        );
      }

      return h.continue;
    });
  },
};

module.exports = {
  Sanitizer,
  sanitizerPlugin,
  HTML_ENTITIES,
  DANGEROUS_PATTERNS,
};
