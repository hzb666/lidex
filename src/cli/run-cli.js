const { buildSite, listPublishHistory, publishSite, rollbackSite, startServer } = require('../index.js');
const { parseCliArgs } = require('./parse-cli-args.js');

function runCli(argv = process.argv.slice(2)) {
  const options = parseCliArgs(argv);
  if (options.rollbackId) {
    return rollbackSite(options);
  }

  if (options.listHistory) {
    return listPublishHistory(options);
  }

  if (options.publish) {
    return publishSite(options);
  }

  if (options.build) {
    return buildSite(options);
  }

  const server = startServer(options);

  if (server && typeof server.on === 'function') {
    server.on('error', (error) => {
      console.error(error && error.message ? error.message : error);
      process.exitCode = 1;
    });
  }

  return server;
}

module.exports = {
  runCli,
};
