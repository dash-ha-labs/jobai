import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extDir = path.resolve('apps/extension/dist');
const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-log2-'));

const chrome = spawn(chromePath, [
  '--headless=new',
  '--enable-automation',
  '--enable-logging=stderr',
  '--v=1',
  `--user-data-dir=${tmpUserData}`,
  `--load-extension=${extDir}`,
  'about:blank',
], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
chrome.stderr.on('data', (d) => { output += d.toString(); });

setTimeout(() => {
  chrome.kill('SIGKILL');
  console.log('--load-extension allowed?', !output.includes('--load-extension is not allowed'));
  const lines = output.split('\n').filter(l => l.includes('extension') || l.includes('JobAI'));
  console.log('Filtered:', lines.slice(0, 20).join('\n'));
  try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch {}
}, 2500);
