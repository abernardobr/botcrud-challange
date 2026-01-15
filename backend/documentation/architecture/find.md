# Query & Filter API Documentation

This document describes the query and filtering functionality for each domain and how to use filtering and pagination.

## Table of Contents

- [Common Parameters](#common-parameters)
- [Response Formats](#response-formats)
- [Bots Domain](#bots-domain)
- [Workers Domain](#workers-domain)
- [Logs Domain](#logs-domain)
- [Filter Parameter Usage](#filter-parameter-usage)
- [Error Handling](#error-handling)
- [Security: Query Sanitization](#security-query-sanitization)

---

## Common Parameters

All `findAll` endpoints support the following common parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 0 | Page number (0-based index) |
| `perPage` | number | 20 | Items per page (min: 1, max: 100) |
| `filter` | object | {} | MongoDB query object for custom filtering |

Nested endpoints (like `getWorkers`, `getLogs`) support the `filter` parameter but not pagination.

---

## Response Formats

### Paginated Response (findAll endpoints)

```json
{
  "count": 100,
  "items": [...],
  "page": 0,
  "perPage": 20
}
```

| Field | Type | Description |
|-------|------|-------------|
| `count` | number | Total number of items matching the query |
| `items` | array | Array of items for the current page |
| `page` | number | Current page number (0-based) |
| `perPage` | number | Number of items per page |

### Array Response (nested endpoints)

Nested endpoints return a simple array of items without pagination metadata.

---

## Bots Domain

### List All Bots

```
GET /bots
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by bot status. Valid values: `ENABLED`, `DISABLED` |
| `filter` | object | MongoDB query filter |
| `page` | number | Page number (0-based) |
| `perPage` | number | Items per page |

**Allowed Filter Fields:** `name`, `description`, `status`, `created`

**Response Format:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "MyBot",
  "description": "Bot description",
  "status": "ENABLED",
  "created": 1704067200000
}
```

**Examples:**

```
GET /bots
GET /bots?page=2&perPage=10
GET /bots?status=ENABLED
```

```javascript
// Custom filter - bots created after a date
const query = {
  filter: { created: { $gte: new Date('2024-01-01') } },
  page: 0,
  perPage: 20
};

// Custom filter - bots with name matching pattern
const query = {
  filter: { name: { $regex: 'test', $options: 'i' } }
};
```

---

### Get Workers for a Bot

```
GET /bots/:botId/workers
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | object | MongoDB query filter |

**Allowed Filter Fields:** `name`, `description`, `created`

**Note:** The `bot` field is automatically set to the `botId` from the URL.

**Examples:**

```
GET /bots/507f1f77bcf86cd799439011/workers
```

```javascript
// Filter workers by name pattern
const query = {
  filter: { name: { $regex: 'processor', $options: 'i' } }
};

// Filter workers created after a date
const query = {
  filter: { created: { $gte: new Date('2024-01-01') } }
};
```

---

### Get Logs for a Bot

```
GET /bots/:botId/logs
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | object | MongoDB query filter |

**Allowed Filter Fields:** `message`, `worker`, `created`

**Note:** The `bot` field is automatically set to the `botId` from the URL.

**Examples:**

```
GET /bots/507f1f77bcf86cd799439011/logs
```

```javascript
// Filter logs by message content
const query = {
  filter: { message: { $regex: 'error', $options: 'i' } }
};

// Filter logs by worker and date range
const query = {
  filter: {
    worker: '507f1f77bcf86cd799439012',
    created: { $gte: new Date('2024-01-01') }
  }
};
```

---

## Workers Domain

### List All Workers

```
GET /workers
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bot` | string | Filter workers by bot ID (MongoDB ObjectId) |
| `filter` | object | MongoDB query filter |
| `page` | number | Page number (0-based) |
| `perPage` | number | Items per page |

**Allowed Filter Fields:** `name`, `description`, `bot`, `created`

**Response Format:**

```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "Worker1",
  "description": "Worker description",
  "bot": "507f1f77bcf86cd799439011",
  "created": 1704067200000
}
```

**Examples:**

```
GET /workers
GET /workers?bot=507f1f77bcf86cd799439011
GET /workers?page=1&perPage=50
```

```javascript
// Custom filter - workers with specific name
const query = {
  filter: { name: 'ProcessWorker' },
  bot: '507f1f77bcf86cd799439011'
};

// Custom filter - workers without description
const query = {
  filter: { description: null }
};
```

---

### Get Logs for a Worker

```
GET /workers/:workerId/logs
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | object | MongoDB query filter |

**Allowed Filter Fields:** `message`, `bot`, `created`

**Note:** The `worker` field is automatically set to the `workerId` from the URL.

**Examples:**

```
GET /workers/507f1f77bcf86cd799439012/logs
```

```javascript
// Filter logs by message content
const query = {
  filter: { message: { $regex: 'success', $options: 'i' } }
};

// Filter logs by date range
const query = {
  filter: {
    created: {
      $gte: new Date('2024-01-01'),
      $lt: new Date('2024-02-01')
    }
  }
};
```

---

### Get Logs for a Bot's Worker

```
GET /bots/:botId/workers/:workerId/logs
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | object | MongoDB query filter |

**Allowed Filter Fields:** `message`, `created`

**Note:** The `bot` and `worker` fields are automatically set from the URL parameters.

**Examples:**

```
GET /bots/507f1f77bcf86cd799439011/workers/507f1f77bcf86cd799439012/logs
```

```javascript
// Filter logs by message content
const query = {
  filter: { message: { $regex: 'processed', $options: 'i' } }
};

// Filter logs created today
const query = {
  filter: {
    created: { $gte: new Date().setHours(0, 0, 0, 0) }
  }
};
```

---

## Logs Domain

### List All Logs

```
GET /logs
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bot` | string | Filter logs by bot ID (MongoDB ObjectId) |
| `worker` | string | Filter logs by worker ID (MongoDB ObjectId) |
| `filter` | object | MongoDB query filter |
| `page` | number | Page number (0-based) |
| `perPage` | number | Items per page |

**Allowed Filter Fields:** `message`, `bot`, `worker`, `created`

**Response Format:**

```json
{
  "id": "507f1f77bcf86cd799439013",
  "message": "Log message content",
  "bot": "507f1f77bcf86cd799439011",
  "worker": "507f1f77bcf86cd799439012",
  "created": "2024-01-01T12:00:00.000Z"
}
```

**Examples:**

```
GET /logs
GET /logs?bot=507f1f77bcf86cd799439011
GET /logs?worker=507f1f77bcf86cd799439012
GET /logs?bot=507f1f77bcf86cd799439011&worker=507f1f77bcf86cd799439012
```

```javascript
// Custom filter - logs containing specific text
const query = {
  filter: { message: { $regex: 'error', $options: 'i' } }
};

// Custom filter - logs created in date range
const query = {
  filter: {
    created: {
      $gte: new Date('2024-01-01'),
      $lt: new Date('2024-02-01')
    }
  }
};
```

---

## Filter Parameter Usage

The `filter` parameter accepts any valid MongoDB query object. It is merged with domain-specific filters.

### Priority

When both `filter` and domain-specific parameters are provided, they are combined. Domain-specific parameters (like `bot`, `worker`, `status`) override any conflicting values in the filter:

```javascript
// Query:
{
  filter: { name: { $regex: 'test' } },
  status: 'ENABLED'
}

// Results in MongoDB query:
{
  name: { $regex: 'test' },
  status: 'ENABLED'
}
```

### Supported MongoDB Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal | `{ status: { $eq: 'ENABLED' } }` |
| `$ne` | Not equal | `{ status: { $ne: 'DISABLED' } }` |
| `$gt` | Greater than | `{ created: { $gt: timestamp } }` |
| `$gte` | Greater than or equal | `{ created: { $gte: timestamp } }` |
| `$lt` | Less than | `{ created: { $lt: timestamp } }` |
| `$lte` | Less than or equal | `{ created: { $lte: timestamp } }` |
| `$in` | In array | `{ status: { $in: ['ENABLED', 'DISABLED'] } }` |
| `$nin` | Not in array | `{ status: { $nin: ['DISABLED'] } }` |
| `$regex` | Pattern match | `{ name: { $regex: 'bot', $options: 'i' } }` |
| `$exists` | Field exists | `{ description: { $exists: true } }` |
| `$type` | BSON type | `{ created: { $type: 'date' } }` |
| `$all` | Array contains all | `{ tags: { $all: ['a', 'b'] } }` |
| `$elemMatch` | Array element match | `{ items: { $elemMatch: { x: 1 } } }` |
| `$size` | Array size | `{ items: { $size: 3 } }` |
| `$mod` | Modulo | `{ qty: { $mod: [4, 0] } }` |
| `$not` | Logical NOT | `{ name: { $not: { $regex: 'test' } } }` |
| `$nor` | Logical NOR | `{ $nor: [{ status: 'ENABLED' }, { name: 'Test' }] }` |
| `$or` | Logical OR | `{ $or: [{ status: 'ENABLED' }, { name: 'Test' }] }` |
| `$and` | Logical AND | `{ $and: [{ status: 'ENABLED' }, { created: { $gt: timestamp } }] }` |

### Example: Complex Query

```javascript
const query = {
  filter: {
    $and: [
      { name: { $regex: '^Bot', $options: 'i' } },
      { created: { $gte: new Date('2024-01-01') } },
      {
        $or: [
          { status: 'ENABLED' },
          { description: { $exists: true, $ne: null } }
        ]
      }
    ]
  },
  page: 0,
  perPage: 10
};
```

---

## Error Handling

### Invalid ID Format
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid bot ID format"
}
```

### Resource Not Found
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Bot with id '507f1f77bcf86cd799439011' not found"
}
```

### Invalid Status (Bots only)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid status. Must be one of: ENABLED, DISABLED"
}
```

### Query Injection Blocked
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Operator \"$where\" is not allowed in queries"
}
```

### Invalid Query Field
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid query key: \"__proto__\""
}
```

### Query Depth Exceeded
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Query exceeds maximum nesting depth"
}
```

---

## Security: Query Sanitization

All endpoints that accept a `filter` parameter sanitize it to prevent MongoDB query injection attacks.

### Blocked Operators

The following dangerous operators are blocked:

| Operator | Reason |
|----------|--------|
| `$where` | Executes arbitrary JavaScript |
| `$function` | Executes JavaScript (MongoDB 4.4+) |
| `$accumulator` | Executes JavaScript in aggregation |
| `$expr` | Can be used for injection |
| `$jsonSchema` | Can cause DoS with complex schemas |
| `$text` | Performance-intensive, should be controlled |
| `$geoNear` | Performance-intensive, should be controlled |

### Allowed Operators

Only the following safe operators are permitted:

**Comparison:** `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`

**Logical:** `$and`, `$or`, `$not`, `$nor`

**Element:** `$exists`, `$type`

**Array:** `$all`, `$elemMatch`, `$size`

**Evaluation:** `$regex`, `$options`, `$mod`

### Field Restrictions by Endpoint

Each endpoint restricts which fields can be filtered at the top level:

| Endpoint | Allowed Fields |
|----------|----------------|
| `GET /bots` | `name`, `description`, `status`, `created` |
| `GET /bots/:id/workers` | `name`, `description`, `created` |
| `GET /bots/:id/logs` | `message`, `worker`, `created` |
| `GET /workers` | `name`, `description`, `bot`, `created` |
| `GET /workers/:id/logs` | `message`, `bot`, `created` |
| `GET /bots/:id/workers/:id/logs` | `message`, `created` |
| `GET /logs` | `message`, `bot`, `worker`, `created` |

### Protection Mechanisms

1. **Dangerous operator blocking** - Operators that execute JavaScript are rejected
2. **Operator whitelist** - Only safe operators are allowed
3. **Field whitelist** - Only known fields can be filtered at the top level
4. **Depth limiting** - Queries are limited to 10 levels of nesting
5. **Prototype pollution prevention** - Keys like `__proto__`, `constructor`, `prototype` are blocked
6. **String value validation** - String values starting with `$` are rejected

### Example: Blocked Queries

```javascript
// BLOCKED - $where executes JavaScript
{ filter: { $where: 'this.name.length > 5' } }

// BLOCKED - $function executes JavaScript
{ filter: { $function: { body: 'function() { return true; }' } } }

// BLOCKED - Prototype pollution attempt
{ filter: { '__proto__': { admin: true } } }

// BLOCKED - String starting with $
{ filter: { name: '$dangerous' } }

// BLOCKED - Unknown operator
{ filter: { name: { $unknown: 'value' } } }

// BLOCKED - Exceeds depth limit (10+ levels of nesting)
{ filter: { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 1 } } } } } } } } } } } }
```
