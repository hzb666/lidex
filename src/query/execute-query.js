const { evaluateWhere, validateWhere } = require('./evaluate-where.js');

function compareValues(left, right, order) {
  if (left === right) {
    return 0;
  }

  const comparison = left > right ? 1 : -1;
  return order === 'desc' ? comparison * -1 : comparison;
}

function normalizePagingValue(value, label, fallback) {
  if (value == null) {
    return fallback;
  }

  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return normalized;
}

function executeQuery(query, datasets) {
  if (!query || !query.from) {
    throw new Error('Query must declare a from source');
  }

  const source = datasets[query.from] || [];
  validateWhere(query.where);
  let results = source.filter((item) => evaluateWhere(item, query.where));

  if (Array.isArray(query.sort) && query.sort.length > 0) {
    results = [...results].sort((left, right) => {
      for (const rule of query.sort) {
        const diff = compareValues(left[rule.field], right[rule.field], rule.order || 'asc');
        if (diff !== 0) {
          return diff;
        }
      }

      return 0;
    });
  }

  const offset = normalizePagingValue(query.offset, 'offset', 0);
  const limit = normalizePagingValue(query.limit, 'limit', results.length);
  return results.slice(offset, offset + limit);
}

module.exports = {
  executeQuery,
};
