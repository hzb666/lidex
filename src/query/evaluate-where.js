const VALID_OPERATORS = new Set([
  'eq',
  'ne',
  'in',
  'contains',
  'startsWith',
  'endsWith',
  'exists',
  'gt',
  'gte',
  'lt',
  'lte',
]);

function matchesCondition(item, condition) {
  const { field, op, value } = condition;
  if (!VALID_OPERATORS.has(op)) {
    throw new Error(`Invalid query operator: ${op}`);
  }

  const actual = item[field];

  switch (op) {
    case 'eq':
      return actual === value;
    case 'ne':
      return actual !== value;
    case 'in':
      return Array.isArray(value) ? value.includes(actual) : false;
    case 'contains':
      return typeof actual === 'string' && actual.includes(value);
    case 'startsWith':
      return typeof actual === 'string' && actual.startsWith(value);
    case 'endsWith':
      return typeof actual === 'string' && actual.endsWith(value);
    case 'exists':
      return value ? actual !== undefined && actual !== null && actual !== '' : actual === undefined || actual === null || actual === '';
    case 'gt':
      return actual > value;
    case 'gte':
      return actual >= value;
    case 'lt':
      return actual < value;
    case 'lte':
      return actual <= value;
    default:
      return false;
  }
}

function validateWhere(where) {
  if (!where) {
    return;
  }

  if (Array.isArray(where.all) && Array.isArray(where.any)) {
    throw new Error('where.all and where.any cannot be used together');
  }

  const groups = [];
  if (Array.isArray(where.all)) {
    groups.push(...where.all);
  }
  if (Array.isArray(where.any)) {
    groups.push(...where.any);
  }

  for (const condition of groups) {
    if (!VALID_OPERATORS.has(condition.op)) {
      throw new Error(`Invalid query operator: ${condition.op}`);
    }
  }
}

function evaluateWhere(item, where) {
  if (!where) {
    return true;
  }

  if (Array.isArray(where.all)) {
    return where.all.every((condition) => matchesCondition(item, condition));
  }

  if (Array.isArray(where.any)) {
    return where.any.some((condition) => matchesCondition(item, condition));
  }

  return true;
}

module.exports = {
  VALID_OPERATORS,
  evaluateWhere,
  validateWhere,
};
