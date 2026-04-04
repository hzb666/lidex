const path = require('node:path');

const packageRoot = path.resolve(__dirname, '../..');

module.exports = {
  port: 3001,
  host: '127.0.0.1',
  assetsDir: 'assets',
  theme: {
    mountPath: '/__lydex/theme',
    directory: path.join(packageRoot, 'theme'),
    baseCss: 'base.css',
    componentsCss: 'components.css',
    appJs: 'app.js',
  },
  templates: {
    pageShell: path.join(packageRoot, 'templates/page-shell.html'),
    cardGrid: path.join(packageRoot, 'templates/blocks/card-grid.html'),
    standardDetail: path.join(packageRoot, 'templates/details/standard-detail.html'),
  },
  queryTemplates: {
    compactList: path.join(packageRoot, 'templates/query/compact-list.html'),
  },
};

