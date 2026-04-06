const fs = require('node:fs');

const { LidexError } = require('../utils/errors.js');

function loadTemplate(templatePath) {
  if (!templatePath || !fs.existsSync(templatePath)) {
    throw new LidexError(`Template not found: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf8');
}

module.exports = {
  loadTemplate,
};

