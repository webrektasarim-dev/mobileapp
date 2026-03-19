#!/usr/bin/env node
/** Kök postinstall: sadece backend/ içinde ci|install + build (kök npm döngüsü yok). */
const path = require('path');
const { spawnSync } = require('child_process');

const backendRoot = path.join(__dirname, '..', 'backend');

function run(cmd, args) {
  return spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: backendRoot,
    shell: true,
    env: process.env,
  });
}

let r = run('npm', ['ci']);
if (r.status !== 0) {
  r = run('npm', ['install']);
  if (r.status !== 0) process.exit(r.status || 1);
}
r = run('npm', ['run', 'build']);
process.exit(r.status === null ? 1 : r.status);
