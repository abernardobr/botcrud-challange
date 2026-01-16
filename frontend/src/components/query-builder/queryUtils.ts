import type { Condition } from './QueryConditionRow.vue';
import type { FieldConfig } from './QueryFieldSelector.vue';

/**
 * Get the field type from fields configuration
 */
export function getFieldType(fields: FieldConfig[], fieldValue: string): string {
  const field = fields.find(f => f.value === fieldValue);
  return field?.type || 'string';
}

/**
 * Get default operator for a field type
 */
export function getDefaultOperator(fieldType: string): string {
  switch (fieldType) {
    case 'status':
      return '$eq';
    case 'date':
      return '$eq';
    default:
      return '$regex';
  }
}

/**
 * Build a single condition into MongoDB query format
 */
export function buildCondition(
  condition: Condition,
  fields: FieldConfig[]
): Record<string, unknown> {
  const { field, operator, value } = condition;

  switch (operator) {
    case '$regex':
      return { [field]: { $regex: value, $options: 'i' } };
    case '$startsWith':
      return { [field]: { $regex: `^${value}`, $options: 'i' } };
    case '$endsWith':
      return { [field]: { $regex: `${value}$`, $options: 'i' } };
    case '$exists':
      return { [field]: { $exists: true, $ne: null } };
    case '$notExists':
      return { [field]: { $exists: false } };
    case '$eq':
      if (getFieldType(fields, field) === 'date' && value) {
        return {
          [field]: {
            $gte: new Date(value as string).getTime(),
            $lt: new Date(value as string).getTime() + 86400000,
          },
        };
      }
      return { [field]: value };
    case '$ne':
      return { [field]: { $ne: value } };
    case '$gt':
    case '$gte':
    case '$lt':
    case '$lte':
      if (getFieldType(fields, field) === 'date' && value) {
        return { [field]: { [operator]: new Date(value as string).getTime() } };
      }
      return { [field]: { [operator]: value } };
    case '$in':
    case '$nin':
      return { [field]: { [operator]: Array.isArray(value) ? value : [value] } };
    default:
      return { [field]: value };
  }
}

/**
 * Build a group of conditions into MongoDB query format
 */
export function buildGroup(
  group: { connector: string; conditions: Condition[] },
  fields: FieldConfig[]
): Record<string, unknown> {
  if (group.conditions.length === 1) {
    return buildCondition(group.conditions[0], fields);
  }
  return {
    [group.connector]: group.conditions.map(c => buildCondition(c, fields)),
  };
}

/**
 * Generate MongoDB query from conditions
 */
export function generateQuery(
  conditions: Condition[],
  fields: FieldConfig[]
): Record<string, unknown> {
  if (conditions.length === 0) return {};

  const validConditions = conditions.filter(c => {
    if (c.operator === '$exists' || c.operator === '$notExists') return true;
    if (Array.isArray(c.value)) return c.value.length > 0;
    return c.value !== '';
  });

  if (validConditions.length === 0) return {};

  if (validConditions.length === 1) {
    return buildCondition(validConditions[0], fields);
  }

  // Group conditions by connector
  const result: Record<string, unknown>[] = [];
  let currentGroup: { connector: string; conditions: Condition[] } | null = null;

  validConditions.forEach((condition, index) => {
    if (index === 0) {
      currentGroup = { connector: '$and', conditions: [condition] };
    } else {
      if (currentGroup && condition.connector === currentGroup.connector) {
        currentGroup.conditions.push(condition);
      } else {
        if (currentGroup) {
          result.push(buildGroup(currentGroup, fields));
        }
        currentGroup = { connector: condition.connector, conditions: [condition] };
      }
    }
  });

  if (currentGroup) {
    result.push(buildGroup(currentGroup, fields));
  }

  if (result.length === 1) {
    return result[0];
  }

  return { $and: result };
}

/**
 * Get condition explanation text
 */
export function getConditionExplanation(
  condition: Condition,
  fieldLabel: string,
  fields: FieldConfig[],
  statusOpts: { label: string; value: string }[],
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const { field, operator, value } = condition;
  const fieldType = getFieldType(fields, field);
  const isStatusField = fieldType === 'status';

  const getLabel = (id: string): string => {
    if (!id) return '';
    const opt = statusOpts.find(o => String(o.value).trim() === String(id).trim());
    return opt?.label || id;
  };

  const formatVal = (val: string | string[]): string => {
    if (!isStatusField) {
      return Array.isArray(val) ? val.join(', ') : String(val);
    }
    if (Array.isArray(val)) {
      return val.map(getLabel).join(', ');
    }
    return getLabel(String(val));
  };

  const formatArr = (val: string | string[]): string => {
    const arr = Array.isArray(val) ? val : [val];
    const displayArr = isStatusField ? arr.map(getLabel) : arr;
    if (displayArr.length === 0) return '';
    if (displayArr.length === 1) return displayArr[0];
    if (displayArr.length === 2)
      return `${displayArr[0]} ${t('queryBuilder.explanations.or')} ${displayArr[1]}`;
    return (
      displayArr.slice(0, -1).join(', ') +
      ` ${t('queryBuilder.explanations.or')} ${displayArr[displayArr.length - 1]}`
    );
  };

  switch (operator) {
    case '$regex':
      return t('queryBuilder.explanations.contains', { field: fieldLabel, value: value as string });
    case '$startsWith':
      return t('queryBuilder.explanations.startsWith', { field: fieldLabel, value: value as string });
    case '$endsWith':
      return t('queryBuilder.explanations.endsWith', { field: fieldLabel, value: value as string });
    case '$exists':
      return t('queryBuilder.explanations.exists', { field: fieldLabel });
    case '$notExists':
      return t('queryBuilder.explanations.notExists', { field: fieldLabel });
    case '$eq':
      return t('queryBuilder.explanations.equals', { field: fieldLabel, value: formatVal(value) });
    case '$ne':
      return t('queryBuilder.explanations.notEquals', { field: fieldLabel, value: formatVal(value) });
    case '$gt':
      return t('queryBuilder.explanations.after', { field: fieldLabel, value: formatVal(value) });
    case '$gte':
      return t('queryBuilder.explanations.onOrAfter', { field: fieldLabel, value: formatVal(value) });
    case '$lt':
      return t('queryBuilder.explanations.before', { field: fieldLabel, value: formatVal(value) });
    case '$lte':
      return t('queryBuilder.explanations.onOrBefore', { field: fieldLabel, value: formatVal(value) });
    case '$in':
      return t('queryBuilder.explanations.isAnyOf', { field: fieldLabel, value: formatArr(value) });
    case '$nin':
      return t('queryBuilder.explanations.isNoneOf', { field: fieldLabel, value: formatArr(value) });
    default:
      return `${fieldLabel} ${operator} ${value}`;
  }
}

/**
 * Generate human-readable explanation from conditions
 */
export function generateExplanation(
  conditions: Condition[],
  fields: FieldConfig[],
  statusOpts: { label: string; value: string }[],
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (conditions.length === 0) return '';

  const validConditions = conditions.filter(c => {
    if (c.operator === '$exists' || c.operator === '$notExists') return true;
    if (Array.isArray(c.value)) return c.value.length > 0;
    return c.value !== '';
  });

  if (validConditions.length === 0) return t('queryBuilder.noValidConditions');

  const parts = validConditions.map((condition, index) => {
    const fieldLabel = fields.find(f => f.value === condition.field)?.label || condition.field;
    const explanation = getConditionExplanation(condition, fieldLabel, fields, statusOpts, t);

    if (index === 0) return explanation;

    const connector =
      condition.connector === '$or'
        ? t('queryBuilder.explanations.or')
        : t('queryBuilder.explanations.and');

    return `${connector} ${explanation}`;
  });

  return t('queryBuilder.explanations.showWhere') + ' ' + parts.join(' ');
}

/**
 * Parse a filter object and load conditions
 */
export function parseFilterToConditions(
  filter: Record<string, unknown>,
  getNextId: () => number
): Condition[] {
  const conditions: Condition[] = [];

  if (!filter || Object.keys(filter).length === 0) return conditions;

  const parseCondition = (
    fieldName: string,
    fieldValue: unknown,
    connector: '$and' | '$or' = '$and'
  ) => {
    if (typeof fieldValue === 'object' && fieldValue !== null) {
      const operators = Object.keys(fieldValue as Record<string, unknown>);
      const val = fieldValue as Record<string, unknown>;

      if (operators.includes('$regex')) {
        const regexVal = val.$regex as string;
        let operator = '$regex';
        let value = regexVal;

        if (regexVal.startsWith('^')) {
          operator = '$startsWith';
          value = regexVal.substring(1);
        } else if (regexVal.endsWith('$')) {
          operator = '$endsWith';
          value = regexVal.substring(0, regexVal.length - 1);
        }

        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator,
          value,
        });
      } else if (operators.includes('$exists')) {
        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator: val.$exists ? '$exists' : '$notExists',
          value: '',
        });
      } else if (operators.includes('$in')) {
        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator: '$in',
          value: val.$in as string[],
        });
      } else if (operators.includes('$nin')) {
        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator: '$nin',
          value: val.$nin as string[],
        });
      } else if (operators.includes('$ne')) {
        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator: '$ne',
          value: val.$ne as string,
        });
      } else if (operators.includes('$gt')) {
        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator: '$gt',
          value: val.$gt as string,
        });
      } else if (operators.includes('$gte')) {
        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator: '$gte',
          value: val.$gte as string,
        });
      } else if (operators.includes('$lt')) {
        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator: '$lt',
          value: val.$lt as string,
        });
      } else if (operators.includes('$lte')) {
        conditions.push({
          id: getNextId(),
          connector,
          field: fieldName,
          operator: '$lte',
          value: val.$lte as string,
        });
      }
    } else {
      conditions.push({
        id: getNextId(),
        connector,
        field: fieldName,
        operator: '$eq',
        value: fieldValue as string,
      });
    }
  };

  if (filter.$and && Array.isArray(filter.$and)) {
    (filter.$and as Record<string, unknown>[]).forEach((item, idx) => {
      Object.entries(item).forEach(([field, value]) => {
        if (field !== '$and' && field !== '$or') {
          parseCondition(field, value, idx === 0 ? '$and' : '$and');
        }
      });
    });
  } else if (filter.$or && Array.isArray(filter.$or)) {
    (filter.$or as Record<string, unknown>[]).forEach((item, idx) => {
      Object.entries(item).forEach(([field, value]) => {
        if (field !== '$and' && field !== '$or') {
          parseCondition(field, value, idx === 0 ? '$or' : '$or');
        }
      });
    });
  } else {
    Object.entries(filter).forEach(([field, value]) => {
      if (field !== '$and' && field !== '$or') {
        parseCondition(field, value);
      }
    });
  }

  return conditions;
}
