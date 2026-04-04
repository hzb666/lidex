#!/usr/bin/env node

const { runCli } = require('../src/cli/run-cli.js');

try {
  const result = runCli(process.argv.slice(2));
  if (result && typeof result.on !== 'function') {
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
}
