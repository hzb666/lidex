#!/usr/bin/env node

const { runInteractiveCreate } = require('../src/index.js');

runInteractiveCreate().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});
