const { mkdirSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const outputDirectory = resolve(__dirname, '..', 'dist', 'cjs');

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  resolve(outputDirectory, 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
  'utf8',
);
