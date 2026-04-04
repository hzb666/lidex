const path = require('node:path');

function resolveWithinRoot(rootDir, relativePath) {
  return path.resolve(rootDir, relativePath);
}

function isPathInside(rootDir, targetPath) {
  const relative = path.relative(rootDir, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

module.exports = {
  isPathInside,
  resolveWithinRoot,
};
