const { isMarkdownDirective } = require('./markdown-directives.js');
const { formatPathLocation } = require('./source-location.js');

function formatParseLocation(context = {}, lineNumber) {
  const fileLineOffset = Number.isInteger(context.lineOffset) ? context.lineOffset : 0;
  const displayLine = fileLineOffset + lineNumber;
  const location = context.filePath
    ? formatPathLocation(context.rootDir, context.filePath, displayLine)
    : '';

  return location ? ` at ${location}` : ` at line ${displayLine}`;
}

function parseFieldLine(line, seenFields, blockName, lineNumber, context = {}) {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error(`Invalid field in ${blockName}${formatParseLocation(context, lineNumber)}`);
  }

  const key = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();

  if (!key) {
    throw new Error(`Invalid field in ${blockName}${formatParseLocation(context, lineNumber)}`);
  }

  if (seenFields.has(key)) {
    throw new Error(`Duplicate field "${key}" in ${blockName}${formatParseLocation(context, lineNumber)}`);
  }

  seenFields.add(key);
  return [key, value];
}

function parseBlocks(markdown = '', context = {}) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const nodes = [];
  let current = null;
  let currentDirective = null;
  let inCodeFence = false;
  const fileLineOffset = Number.isInteger(context.lineOffset) ? context.lineOffset : 0;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    const lineNumber = index + 1;

    if (!current && trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) {
      continue;
    }

    if (currentDirective && trimmed === ':::') {
      currentDirective = null;
      continue;
    }

    if (currentDirective) {
      continue;
    }

    if (!current && trimmed.startsWith(':::')) {
      const name = trimmed.slice(3).trim();
      if (!name) {
        throw new Error(`Blank block name${formatParseLocation(context, lineNumber)}`);
      }

      if (isMarkdownDirective(name)) {
        currentDirective = {
          name,
          startLine: lineNumber,
        };
        continue;
      }

      current = {
        name,
        startLine: lineNumber,
        lines: [],
      };
      continue;
    }

    if (current && trimmed === ':::') {
      const seenFields = new Set();
      const fields = {};
      const fieldLines = {};

      for (let lineIndex = 0; lineIndex < current.lines.length; lineIndex += 1) {
        const line = current.lines[lineIndex];
        if (!line.trim()) {
          continue;
        }

        const fieldLineNumber = current.startLine + lineIndex + 1;
        const [key, value] = parseFieldLine(
          line,
          seenFields,
          current.name,
          fieldLineNumber,
          context,
        );
        fields[key] = value;
        fieldLines[key] = fileLineOffset + fieldLineNumber;
      }

      nodes.push({
        type: current.name === 'query' ? 'query' : 'block',
        name: current.name,
        fields: current.name === 'query' ? undefined : fields,
        params: current.name === 'query' ? fields : undefined,
        source: {
          filePath: context.filePath || '',
          pageKey: context.pageKey || '',
          startLine: current.startLine,
          endLine: lineNumber,
          fileStartLine: fileLineOffset + current.startLine,
          fileEndLine: fileLineOffset + lineNumber,
          fieldLines,
        },
      });

      current = null;
      continue;
    }

    if (current) {
      current.lines.push(rawLine);
    }
  }

  if (current) {
    throw new Error(`Block "${current.name}" is missing closing fence${formatParseLocation(context, current.startLine)}`);
  }

  if (currentDirective) {
    throw new Error(`Directive "${currentDirective.name}" is missing closing fence${formatParseLocation(context, currentDirective.startLine)}`);
  }

  return nodes;
}

module.exports = {
  parseBlocks,
};
