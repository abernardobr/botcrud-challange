/**
 * DataStore - In-memory data store for JSON data
 * Provides CRUD operations on JSON files loaded into memory
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DataStore {
  constructor() {
    this._data = {};
    this._dataPath = path.join(__dirname);
  }

  /**
   * Initialize the data store by loading all JSON files
   */
  init() {
    this._loadData('bots');
    this._loadData('workers');
    this._loadData('logs');
  }

  /**
   * Load data from a JSON file
   * @param {string} collection - Collection name (file name without .json)
   */
  _loadData(collection) {
    const filePath = path.join(this._dataPath, `${collection}.json`);
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      this._data[collection] = JSON.parse(rawData);
    } catch (err) {
      console.error(`[DataStore] Error loading ${collection}:`, err.message);
      this._data[collection] = [];
    }
  }

  /**
   * Get all items from a collection
   * @param {string} collection - Collection name
   * @param {Object} filters - Optional filter criteria
   * @returns {Array} Filtered items
   */
  findAll(collection, filters = {}) {
    let items = [...this._data[collection]];

    // Apply filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        items = items.filter((item) => item[key] === filters[key]);
      }
    });

    return items;
  }

  /**
   * Get a single item by ID
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @returns {Object|null} Found item or null
   */
  findById(collection, id) {
    return this._data[collection].find((item) => item.id === id) || null;
  }

  /**
   * Create a new item
   * @param {string} collection - Collection name
   * @param {Object} data - Item data
   * @returns {Object} Created item
   */
  create(collection, data) {
    const item = {
      id: uuidv4(),
      ...data,
      created: Date.now(),
    };
    this._data[collection].push(item);
    return item;
  }

  /**
   * Update an item by ID
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @param {Object} data - Update data
   * @returns {Object|null} Updated item or null if not found
   */
  updateById(collection, id, data) {
    const index = this._data[collection].findIndex((item) => item.id === id);
    if (index === -1) {return null;}

    // Don't allow updating immutable fields
    const { id: _id, created: _created, ...updateData } = data;

    this._data[collection][index] = {
      ...this._data[collection][index],
      ...updateData,
    };

    return this._data[collection][index];
  }

  /**
   * Delete an item by ID
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @returns {Object|null} Deleted item or null if not found
   */
  deleteById(collection, id) {
    const index = this._data[collection].findIndex((item) => item.id === id);
    if (index === -1) {return null;}

    const deleted = this._data[collection].splice(index, 1);
    return deleted[0];
  }

  /**
   * Find items with related data
   * @param {string} collection - Collection name
   * @param {string} foreignKey - Foreign key field name
   * @param {string} foreignValue - Foreign key value to match
   * @returns {Array} Matching items
   */
  findByForeignKey(collection, foreignKey, foreignValue) {
    return this._data[collection].filter((item) => item[foreignKey] === foreignValue);
  }

  /**
   * Count items in a collection with optional filters
   * @param {string} collection - Collection name
   * @param {Object} filters - Optional filter criteria
   * @returns {number} Count of matching items
   */
  count(collection, filters = {}) {
    return this.findAll(collection, filters).length;
  }
}

// Singleton instance
const dataStore = new DataStore();

module.exports = dataStore;
