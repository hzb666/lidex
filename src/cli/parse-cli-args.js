const { LidexError } = require('../utils/errors.js');

const SUPPORTED_FLAGS = {
  '--build': 'build',
  '--publish': 'publish',
  '--list-history': 'listHistory',
  '--reload': 'reload',
  '--rollback': 'rollbackId',
  '--root': 'rootDir',
  '--out': 'outDir',
  '--target': 'targetDir',
  '--history-dir': 'historyDir',
  '--port': 'port',
  '--host': 'host',
  '--config': 'config',
  '--admin-path': 'adminPath',
};

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) {
    throw new LidexError(`Invalid value for --port: ${value}`);
  }

  return port;
}

function parseCliArgs(argv = []) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const optionName = SUPPORTED_FLAGS[flag];

    if (!optionName) {
      throw new LidexError(`Unknown CLI argument: ${flag}`);
    }

    if (
      optionName === 'build'
      || optionName === 'publish'
      || optionName === 'listHistory'
      || optionName === 'reload'
    ) {
      options[optionName] = true;
      continue;
    }

    const value = argv[index + 1];
    if (value == null || String(value).startsWith('--')) {
      throw new LidexError(`Missing value for ${flag}`);
    }

    options[optionName] = optionName === 'port' ? parsePort(value) : value;
    index += 1;
  }

  return options;
}

module.exports = {
  parseCliArgs,
};

