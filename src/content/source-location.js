const path = require('node:path');

function toPosixPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function getDisplaySourceLine(source = {}) {
  if (Number.isInteger(source.fileStartLine)) {
    return source.fileStartLine;
  }

  if (Number.isInteger(source.startLine)) {
    return source.startLine;
  }

  return null;
}

function getSourceFieldLine(source = {}, fieldName = '') {
  const fieldLines = source && source.fieldLines ? source.fieldLines : null;
  if (!fieldLines || !Number.isInteger(fieldLines[fieldName])) {
    return null;
  }

  return fieldLines[fieldName];
}

function getFieldSource(source = {}, fieldName = '') {
  const fieldLine = getSourceFieldLine(source, fieldName);
  if (!Number.isInteger(fieldLine)) {
    return source;
  }

  return {
    ...source,
    fileStartLine: fieldLine,
    startLine: fieldLine,
  };
}

function formatPathLocation(rootDir, filePath, lineNumber) {
  if (!filePath) {
    return '';
  }

  const relativePath = rootDir ? toPosixPath(path.relative(rootDir, filePath)) : '';
  const displayPath = relativePath && !relativePath.startsWith('..')
    ? relativePath
    : toPosixPath(filePath);

  return Number.isInteger(lineNumber) ? `${displayPath}:${lineNumber}` : displayPath;
}

function formatSourceLocation(rootDir, source = {}) {
  return formatPathLocation(
    rootDir,
    source.filePath || source.path || source.sourcePath || '',
    getDisplaySourceLine(source),
  );
}

function formatNodeLocation(rootDir, node) {
  return formatSourceLocation(rootDir, node && node.source ? node.source : {});
}

function formatNodeFieldLocation(rootDir, node, fieldName) {
  return formatSourceLocation(rootDir, getFieldSource(node && node.source ? node.source : {}, fieldName));
}

function appendSourceLocation(message, rootDir, source, preposition = 'in') {
  const location = formatSourceLocation(rootDir, source);
  return location ? `${message} ${preposition} ${location}` : message;
}

function appendNodeFieldLocation(message, rootDir, node, fieldName, preposition = 'in') {
  const location = formatNodeFieldLocation(rootDir, node, fieldName);
  return location ? `${message} ${preposition} ${location}` : message;
}

function findFrontmatterFieldLine(markdown = '', fieldName = '') {
  const normalized = String(markdown || '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return null;
  }

  const lines = normalized.split('\n');
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === '---') {
      break;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (key === fieldName) {
      return index + 1;
    }
  }

  return null;
}

module.exports = {
  appendNodeFieldLocation,
  appendSourceLocation,
  findFrontmatterFieldLine,
  formatNodeFieldLocation,
  formatNodeLocation,
  formatPathLocation,
  formatSourceLocation,
  getDisplaySourceLine,
  getFieldSource,
  getSourceFieldLine,
  toPosixPath,
};
