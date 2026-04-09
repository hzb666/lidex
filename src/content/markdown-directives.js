const { escapeHtml } = require('../render/render-template.js');
const { formatPathLocation } = require('./source-location.js');

const MARKDOWN_DIRECTIVE_NAMES = new Set(['callout']);
const CALLOUT_REQUIRED_FIELDS = ['type', 'title', 'body'];
const CALLOUT_ICONS = {
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 10.5V16"></path><circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none"></circle></svg>',
  tip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 21h4"></path><path d="M8.5 14.5c-1.2-.9-2-2.4-2-4.1 0-3 2.4-5.4 5.5-5.4s5.5 2.4 5.5 5.4c0 1.7-.8 3.2-2 4.1-.8.6-1.3 1.4-1.5 2.4h-4c-.2-1-.7-1.8-1.5-2.4Z"></path></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 4.9 3.8 16.2A2 2 0 0 0 5.5 19h13a2 2 0 0 0 1.7-2.8L13.7 4.9a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4.5"></path><circle cx="12" cy="16.8" r="1.1" fill="currentColor" stroke="none"></circle></svg>',
  danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.6 3h6.8l4.8 4.8v6.8L15.4 19H8.6L3.8 14.6V7.8L8.6 3Z"></path><path d="M9.4 9.4 14.6 14.6"></path><path d="M14.6 9.4 9.4 14.6"></path></svg>',
};

function normalizeDirectiveName(name = '') {
  return String(name).trim().toLowerCase();
}

function isMarkdownDirective(name) {
  return MARKDOWN_DIRECTIVE_NAMES.has(normalizeDirectiveName(name));
}

function formatDirectiveLocation(context = {}, lineNumber = 1) {
  const lineOffset = Number.isInteger(context.lineOffset) ? context.lineOffset : 0;
  const displayLine = lineOffset + lineNumber;
  const location = context.filePath
    ? formatPathLocation(context.rootDir, context.filePath, displayLine)
    : '';

  return location ? ` at ${location}` : ` at line ${displayLine}`;
}

function parseFieldLine(line, seenFields, directiveName, lineNumber, context = {}) {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error(`Invalid field in ${directiveName}${formatDirectiveLocation(context, lineNumber)}`);
  }

  const key = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();

  if (!key) {
    throw new Error(`Invalid field in ${directiveName}${formatDirectiveLocation(context, lineNumber)}`);
  }

  if (seenFields.has(key)) {
    throw new Error(`Duplicate field "${key}" in ${directiveName}${formatDirectiveLocation(context, lineNumber)}`);
  }

  seenFields.add(key);
  return [key, value];
}

function parseDirectiveFields(lines, context = {}) {
  const { name, startLine = 1 } = context;
  const seenFields = new Set();
  const fields = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    const [key, value] = parseFieldLine(line, seenFields, name, startLine + index + 1, context);
    fields[key] = value;
  }

  return fields;
}

function normalizeCalloutType(value, context = {}) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) {
    throw new Error(`Callout type "${value}" is invalid${formatDirectiveLocation(context, context.startLine || 1)}`);
  }

  return normalized;
}

function renderCallout(fields, context = {}) {
  for (const fieldName of CALLOUT_REQUIRED_FIELDS) {
    if (!fields[fieldName]) {
      throw new Error(`Callout is missing required field "${fieldName}"${formatDirectiveLocation(context, context.startLine || 1)}`);
    }
  }

  const calloutType = normalizeCalloutType(fields.type, context);
  const icon = CALLOUT_ICONS[calloutType] || CALLOUT_ICONS.note;

  return `<aside class="callout callout--${escapeHtml(calloutType)}" data-callout-type="${escapeHtml(calloutType)}"><span class="callout__icon" aria-hidden="true">${icon}</span><div class="callout__content"><p class="callout__title">${escapeHtml(fields.title)}</p><p class="callout__body">${escapeHtml(fields.body)}</p></div></aside>`;
}

module.exports = {
  isMarkdownDirective,
  normalizeDirectiveName,
  parseDirectiveFields,
  renderCallout,
};
