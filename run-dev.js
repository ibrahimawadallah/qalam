#!/usr/bin/env node
const { spawn } = require('child_process');
const nextBin = require.resolve('next/dist/bin/next');
const child = spawn('node', [nextBin, 'dev', '-p', '3000'], {
  stdio: 'inherit',
  env: process.env
});
child.on('close', (code) => process.exit(code));