function parseFrontmatter(markdown = '') {
  const normalized = String(markdown).replace(/\r\n/g, '\n');

  if (!normalized.startsWith('---\n')) {
    return { meta: {}, body: normalized, bodyStartLine: 1 };
  }

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    return { meta: {}, body: normalized, bodyStartLine: 1 };
  }

  const meta = {};
  const raw = normalized.slice(4, end);

  for (const line of raw.split('\n')) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    meta[key] = value;
  }

  const bodySource = normalized.slice(end + 5);
  const body = bodySource.trim();
  const leadingTrimmedLength = bodySource.length - bodySource.trimStart().length;
  const firstBodyCharacterIndex = end + 5 + leadingTrimmedLength;

  return {
    meta,
    body,
    bodyStartLine: normalized.slice(0, firstBodyCharacterIndex).split('\n').length,
  };
}

module.exports = {
  parseFrontmatter,
};
