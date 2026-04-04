function parseFieldLine(line, seenFields, blockName, lineNumber) {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error(`Invalid field in ${blockName} at line ${lineNumber}`);
  }

  const key = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();

  if (!key) {
    throw new Error(`Invalid field in ${blockName} at line ${lineNumber}`);
  }

  if (seenFields.has(key)) {
    throw new Error(`Duplicate field "${key}" in ${blockName} at line ${lineNumber}`);
  }

  seenFields.add(key);
  return [key, value];
}

function parseBlocks(markdown = '', context = {}) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const nodes = [];
  let current = null;
  let inCodeFence = false;

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

    if (!current && trimmed.startsWith(':::')) {
      const name = trimmed.slice(3).trim();
      if (!name) {
        throw new Error(`Blank block name at line ${lineNumber}`);
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

      for (let lineIndex = 0; lineIndex < current.lines.length; lineIndex += 1) {
        const line = current.lines[lineIndex];
        if (!line.trim()) {
          continue;
        }

        const [key, value] = parseFieldLine(
          line,
          seenFields,
          current.name,
          current.startLine + lineIndex + 1,
        );
        fields[key] = value;
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
    throw new Error(`Block "${current.name}" is missing closing fence`);
  }

  return nodes;
}

module.exports = {
  parseBlocks,
};
