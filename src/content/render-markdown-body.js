const { escapeHtml } = require('../render/render-template.js');
const { normalizeDirectiveName, parseDirectiveFields, renderCallout } = require('./markdown-directives.js');
const { formatPathLocation } = require('./source-location.js');

function renderParagraph(lines) {
  const text = lines.join('\n').trim();
  if (!text) {
    return '';
  }

  return `<p>${escapeHtml(text)}</p>`;
}

function renderCodeBlock(lines, language) {
  const languageClass = language ? ` class="language-${escapeHtml(language)}"` : '';
  return `<pre class="markdown-code-block"><code${languageClass}>${escapeHtml(lines.join('\n'))}</code></pre>`;
}

function formatMarkdownLocation(context = {}, lineNumber = 1) {
  const lineOffset = Number.isInteger(context.lineOffset) ? context.lineOffset : 0;
  const displayLine = lineOffset + lineNumber;
  const location = context.filePath
    ? formatPathLocation(context.rootDir, context.filePath, displayLine)
    : '';

  return location ? ` at ${location}` : ` at line ${displayLine}`;
}

function renderDirective(name, lines, startLine, context = {}) {
  const fields = parseDirectiveFields(lines, {
    name,
    startLine,
    filePath: context.filePath,
    rootDir: context.rootDir,
    lineOffset: context.lineOffset,
  });

  if (name === 'callout') {
    return renderCallout(fields, {
      filePath: context.filePath,
      rootDir: context.rootDir,
      lineOffset: context.lineOffset,
      startLine,
    });
  }

  return '';
}

function renderMarkdownBody(markdown = '', context = {}) {
  const lines = String(markdown).replace(/\r/g, '').split('\n');
  const fragments = [];
  let paragraphLines = [];
  let codeLines = [];
  let codeLanguage = '';
  let directiveLines = [];
  let directiveName = '';
  let directiveStartLine = 0;
  let inCodeFence = false;
  let inDirective = false;

  function flushParagraph() {
    const html = renderParagraph(paragraphLines);
    if (html) {
      fragments.push(html);
    }
    paragraphLines = [];
  }

  function flushCodeBlock() {
    fragments.push(renderCodeBlock(codeLines, codeLanguage));
    codeLines = [];
    codeLanguage = '';
  }

  function flushDirective() {
    fragments.push(renderDirective(directiveName, directiveLines, directiveStartLine, context));
    directiveLines = [];
    directiveName = '';
    directiveStartLine = 0;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const lineNumber = index + 1;

    if (!inDirective && trimmed.startsWith('```')) {
      if (inCodeFence) {
        flushCodeBlock();
        inCodeFence = false;
        continue;
      }

      flushParagraph();
      inCodeFence = true;
      codeLanguage = trimmed.slice(3).trim();
      continue;
    }

    if (inCodeFence) {
      codeLines.push(line);
      continue;
    }

    if (!inDirective && trimmed.startsWith(':::')) {
      const name = normalizeDirectiveName(trimmed.slice(3).trim());
      if (name === 'callout') {
        flushParagraph();
        inDirective = true;
        directiveName = name;
        directiveStartLine = lineNumber;
        continue;
      }
    }

    if (inDirective && trimmed === ':::') {
      flushDirective();
      inDirective = false;
      continue;
    }

    if (inDirective) {
      directiveLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    paragraphLines.push(line);
  }

  if (inCodeFence) {
    flushCodeBlock();
    return fragments.join('');
  }

  if (inDirective) {
    throw new Error(`Directive "${directiveName}" is missing closing fence${formatMarkdownLocation(context, directiveStartLine)}`);
  }

  flushParagraph();
  return fragments.join('');
}

module.exports = {
  renderMarkdownBody,
};
