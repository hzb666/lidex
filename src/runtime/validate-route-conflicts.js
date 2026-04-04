const { LydexError } = require('../utils/errors.js');

function assertUniqueRoute(routeOwners, route, owner) {
  const existingOwner = routeOwners.get(route);
  if (existingOwner) {
    throw new LydexError(`Duplicate route "${route}" declared by ${existingOwner} and ${owner}`);
  }

  routeOwners.set(route, owner);
}

function splitRouteSegments(route) {
  const normalized = String(route).replace(/^\/+|\/+$/g, '');
  return normalized ? normalized.split('/') : [];
}

function routesConflict(leftRoute, rightRoute) {
  const leftSegments = splitRouteSegments(leftRoute);
  const rightSegments = splitRouteSegments(rightRoute);

  if (leftSegments.length !== rightSegments.length) {
    return false;
  }

  for (let index = 0; index < leftSegments.length; index += 1) {
    const leftSegment = leftSegments[index];
    const rightSegment = rightSegments[index];
    if (leftSegment === rightSegment) {
      continue;
    }

    if (leftSegment.startsWith(':') || rightSegment.startsWith(':')) {
      continue;
    }

    return false;
  }

  return true;
}

function validateRouteConflicts(config) {
  const routeOwners = [];

  for (const [pageKey, page] of Object.entries(config.pages)) {
    routeOwners.push({ route: page.route, owner: `page "${pageKey}"` });
  }

  for (const [blockKey, block] of Object.entries(config.blocks)) {
    if (!block.hasDetailPage) {
      continue;
    }

    routeOwners.push({ route: block.route, owner: `detail block "${blockKey}"` });
  }

  const exactOwners = new Map();
  for (const entry of routeOwners) {
    assertUniqueRoute(exactOwners, entry.route, entry.owner);
  }

  for (let leftIndex = 0; leftIndex < routeOwners.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < routeOwners.length; rightIndex += 1) {
      const left = routeOwners[leftIndex];
      const right = routeOwners[rightIndex];
      if (routesConflict(left.route, right.route)) {
        throw new LydexError(`Conflicting routes "${left.route}" (${left.owner}) and "${right.route}" (${right.owner})`);
      }
    }
  }
}

module.exports = {
  validateRouteConflicts,
};

