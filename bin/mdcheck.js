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
  console.error('Usage: mdcheck <glob-pattern> [-c concurrency]');
  process.exit(1);
}

const concurrency = parseInt(values.concurrency, 10);

const index = require('../src/index');
index.run(globPattern, { concurrency });
