const fs = require('node:fs');
const path = require('node:path');

const { LidexError } = require('../utils/errors.js');

const THEME_MANIFEST_FILE = 'theme.json';
const THEME_MANIFEST_KEYS = [
  'name',
  'author',
  'version',
  'description',
  'baseCss',
  'componentsCss',
  'appJs',
];

function assertOptionalString(value, key, manifestPath) {
  if (value == null) {
    return;
  }

  if (typeof value !== 'string') {
    throw new LidexError(`Theme manifest field "${key}" must be a string: ${manifestPath}`);
  }
}

function loadThemeManifest(themeDirectory) {
  const manifestPath = path.join(themeDirectory, THEME_MANIFEST_FILE);
  if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) {
    return null;
  }

  const raw = fs.readFileSync(manifestPath, 'utf8');
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new LidexError(`Theme manifest contains invalid JSON: ${manifestPath}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new LidexError(`Theme manifest must be an object: ${manifestPath}`);
  }

  const manifest = {};
  for (const key of THEME_MANIFEST_KEYS) {
    if (key in parsed) {
      assertOptionalString(parsed[key], key, manifestPath);
      manifest[key] = parsed[key];
    }
  }

  return {
    path: manifestPath,
    ...manifest,
  };
}

module.exports = {
  THEME_MANIFEST_FILE,
  loadThemeManifest,
};

