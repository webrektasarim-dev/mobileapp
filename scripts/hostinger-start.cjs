#!/usr/bin/env node
/**
 * dist yoksa: backend/ içinde npm ci|install + build, sonra node dist/main.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'backend');
const mainJs = path.join(backendRoot, 'dist', 'main.js');

function runInBackend(args) {
  return spawnSync('npm', args, {
    stdio: 'inherit',
    cwd: backendRoot,
    shell: true,
    env: process.env,
  });
}

function buildBackend() {
  console.error('[mobileapp-api] backend derleniyor...');
  if (!fs.existsSync(path.join(backendRoot, 'package.json'))) {
    console.error('[mobileapp-api] backend/package.json yok.');
    process.exit(1);
  }
  let r = runInBackend(['ci']);
  if (r.status !== 0) {
    r = runInBackend(['install']);
    if (r.status !== 0) process.exit(r.status || 1);
  }
  r = runInBackend(['run', 'build']);
  if (r.status !== 0) process.exit(r.status || 1);
}

if (!fs.existsSync(mainJs)) {
  buildBackend();
}

if (!fs.existsSync(mainJs)) {
  console.error('[mobileapp-api] dist/main.js oluşmadı:', mainJs);
  process.exit(1);
}

const run = spawnSync(process.execPath, [mainJs], {
  stdio: 'inherit',
  cwd: backendRoot,
  env: process.env,
});
process.exit(run.status === null ? 1 : run.status);
