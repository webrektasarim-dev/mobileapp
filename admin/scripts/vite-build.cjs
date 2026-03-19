/**
 * Hostinger: PATH'te vite/tsc yoksa bile derleme (sadece node).
 * Çalışma dizini admin/ olmalı.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(viteCli)) {
  console.error('Eksik: node_modules/vite. Önce: npm install');
  process.exit(1);
}

const env = { ...process.env, NODE_ENV: 'production' };
const r = spawnSync(process.execPath, [viteCli, 'build'], {
  cwd: root,
  stdio: 'inherit',
  env,
});
process.exit(r.status === null ? 1 : r.status);
