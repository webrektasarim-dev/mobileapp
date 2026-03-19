#!/usr/bin/env node
/**
 * Hostinger: PATH'te tsc yoksa bile derleme (doğrudan node ile).
 * Çalıştır: node scripts/build.cjs  (backend klasöründen)
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
process.chdir(root);

const node = process.execPath;
const prismaCli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js');
const tscCli = path.join(root, 'node_modules', 'typescript', 'lib', 'tsc.js');

function run(msg, file, args) {
  if (!fs.existsSync(file)) {
    console.error('Eksik:', file, '→ önce: npm install');
    process.exit(1);
  }
  const r = spawnSync(node, [file, ...args], { stdio: 'inherit', cwd: root });
  if (r.status !== 0) process.exit(r.status || 1);
}

run('prisma generate', prismaCli, ['generate']);
run('tsc', tscCli, ['-p', 'tsconfig.build.json']);
console.log('Build OK → dist/main.js');
