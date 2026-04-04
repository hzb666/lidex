const { escapeHtml } = require('../render/render-template.js');

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

function renderMarkdownBody(markdown = '') {
  const lines = String(markdown).replace(/\r/g, '').split('\n');
  const fragments = [];
  let paragraphLines = [];
  let codeLines = [];
  let codeLanguage = '';
  let inCodeFence = false;

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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
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

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    paragraphLines.push(line);
  }

  if (inCodeFence) {
    flushCodeBlock();
  } else {
    flushParagraph();
  }

  return fragments.join('');
}

module.exports = {
  renderMarkdownBody,
};
