/**
 * Base Helper Classes
 * Provides common functionality for modules and controllers
 */

'use strict';

const Boom = require('@hapi/boom');
const _ = require('lodash');

/**
 * Dangerous MongoDB operators that can execute arbitrary code
 * These should never be allowed in user-provided queries
 */
const DANGEROUS_OPERATORS = [
  '$where',      // Executes JavaScript
  '$function',   // Executes JavaScript (MongoDB 4.4+)
  '$accumulator', // Executes JavaScript in aggregation
  '$expr',       // Can be used for injection in some contexts
  '$jsonSchema', // Can cause DoS with complex schemas
  '$text',       // Can be expensive, should be controlled
  '$geoNear',    // Should be controlled for performance
];

/**
 * Safe query operators that are allowed in filters
 */
const SAFE_OPERATORS = [
  // Comparison
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
  // Logical
  '$and', '$or', '$not', '$nor',
  // Element
  '$exists', '$type',
  // Array
  '$all', '$elemMatch', '$size',
  // Evaluation (safe subset)
  '$regex', '$options', '$mod',
];

/**
 * ModuleBase - Base class for all domain modules
 * Provides common CRUD operations and error handling
 */
class ModuleBase {
  constructor() {
    this.model = null;
  }

  /**
   * Sanitize a MongoDB query to prevent injection attacks
   * Removes dangerous operators and validates query structure
   *
   * @param {Object} query - The query object to sanitize
   * @param {Object} options - Sanitization options
   * @param {string[]} options.allowedOperators - Additional operators to allow
   * @param {string[]} options.allowedFields - Fields that are allowed (if specified, only these fields are permitted)
   * @param {number} options.maxDepth - Maximum nesting depth (default: 10)
   * @returns {Object} Sanitized query object
   * @throws {Boom.badRequest} If query contains dangerous operators
   */
  _sanitizeQuery(query, options = {}) {
    const {
      allowedOperators = [],
      allowedFields = null,
      maxDepth = 10
    } = options;

    const allAllowedOperators = [...SAFE_OPERATORS, ...allowedOperators];

    const sanitize = (obj, depth = 0) => {
      // Prevent deep nesting attacks
      if (depth > maxDepth) {
        throw Boom.badRequest('Query exceeds maximum nesting depth');
      }

      // Handle null/undefined
      if (obj === null || obj === undefined) {
        return obj;
      }

      // Handle primitives
      if (typeof obj !== 'object') {
        // Check for operator injection in string values
        if (typeof obj === 'string' && obj.startsWith('$')) {
          throw Boom.badRequest(`Invalid query value: "${obj}"`);
        }
        return obj;
      }

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item, depth + 1));
      }

      // Handle Date objects
      if (obj instanceof Date) {
        return obj;
      }

      // Handle RegExp objects
      if (obj instanceof RegExp) {
        return obj;
      }

      // Handle plain objects
      const sanitized = {};

      for (const key of Object.keys(obj)) {
        const value = obj[key];

        // Check for dangerous operators
        if (key.startsWith('$')) {
          if (DANGEROUS_OPERATORS.includes(key)) {
            throw Boom.badRequest(`Operator "${key}" is not allowed in queries`);
          }

          if (!allAllowedOperators.includes(key)) {
            throw Boom.badRequest(`Operator "${key}" is not allowed in queries`);
          }
        } else {
          // Check field whitelist if specified
          if (allowedFields !== null && depth === 0 && !allowedFields.includes(key)) {
            // Skip fields not in whitelist at top level
            continue;
          }
        }

        // Check for prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          throw Boom.badRequest(`Invalid query key: "${key}"`);
        }

        // Recursively sanitize value
        sanitized[key] = sanitize(value, depth + 1);
      }

      return sanitized;
    };

    // Handle non-object input
    if (typeof query !== 'object' || query === null) {
      return {};
    }

    return sanitize(query, 0);
  }

  /**
   * Sanitize and merge filter with additional query conditions
   * Convenience method for findAll operations
   *
   * @param {Object} filter - User-provided filter object
   * @param {Object} additionalFilters - Additional filters to merge (trusted)
   * @param {Object} options - Sanitization options
   * @returns {Object} Merged and sanitized query
   */
  _buildSafeQuery(filter = {}, additionalFilters = {}, options = {}) {
    const sanitizedFilter = this._sanitizeQuery(filter, options);
    return { ...sanitizedFilter, ...additionalFilters };
  }

  /**
   * Extract error message from various error types
   * @param {Error} err - Error object
   * @returns {string} Error message
   */
  _errMessage(err) {
    if (err.message) return err.message;
    if (typeof err === 'string') return err;
    return 'An unexpected error occurred';
  }

  /**
   * Throw a Boom error
   * @param {Error|string} ex - Exception or message
   */
  _throw(ex) {
    if (ex.isBoom) {
      throw ex;
    } else {
      throw Boom.badRequest(this._errMessage(ex));
    }
  }

  /**
   * Create a standard success response
   * @param {string} message - Success message
   * @param {*} data - Response data
   * @returns {Object} Response object
   */
  _successResponse(message, data) {
    return {
      statusCode: 200,
      message: message || 'Success',
      data
    };
  }

  /**
   * Create a not found error
   * @param {string} entity - Entity name
   * @param {string} id - Entity ID
   */
  _notFound(entity, id) {
    throw Boom.notFound(`${entity} with id '${id}' not found`);
  }
}

/**
 * ControllerBase - Base class for all domain controllers
 * Provides common request handling patterns
 */
class ControllerBase {
  constructor() {
    this.module = null;
  }

  /**
   * Handle successful responses
   * @param {string} message - Success message
   * @param {*} data - Response data
   * @returns {Object} Formatted response
   */
  _success(message, data) {
    return {
      statusCode: 200,
      message: message || 'Success',
      data
    };
  }

  /**
   * Handle error responses
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @param {Error} err - Error object
   * @returns {Object} Boom error response
   */
  _error(request, h, err) {
    if (err.isBoom) {
      return err;
    }
    return Boom.badRequest(err.message || 'An error occurred');
  }

  /**
   * Generic find all handler
   */
  async findAll(request, h) {
    try {
      const data = await this.module.findAll(request.query);
      return this._success('Records retrieved successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }

  /**
   * Generic find by ID handler
   */
  async findById(request, h) {
    try {
      const data = await this.module.findById(request.params.id);
      return this._success('Record retrieved successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }

  /**
   * Generic create handler
   */
  async create(request, h) {
    try {
      const data = await this.module.create(request.payload);
      return this._success('Record created successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }

  /**
   * Generic update by ID handler
   */
  async updateById(request, h) {
    try {
      const data = await this.module.updateById(request.params.id, request.payload);
      return this._success('Record updated successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }

  /**
   * Generic delete by ID handler
   */
  async deleteById(request, h) {
    try {
      const data = await this.module.deleteById(request.params.id);
      return this._success('Record deleted successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }
}

module.exports = {
  ModuleBase,
  ControllerBase
};
