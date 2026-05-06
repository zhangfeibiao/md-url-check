#!/usr/bin/env node

const path = require('path');
const { parseArgs } = require('util');

const options = {
  concurrency: {
    type: 'string',
    short: 'c',
    default: '10'
  }
};

const { positionals, values } = parseArgs({ options, allowPositionals: true });

const globPattern = positionals[0];
if (!globPattern) {
  console.error('Usage: mdurlcheck <glob-pattern> [-c concurrency]');
  process.exit(1);
}

const concurrency = parseInt(values.concurrency, 10);

// Validate concurrency
if (isNaN(concurrency) || concurrency < 1) {
  console.error('Error: concurrency must be a positive integer');
  process.exit(1);
}

const index = require('../src/index');
index.run(globPattern, { concurrency });