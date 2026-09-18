import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extDir = path.resolve('apps/extension/dist');
const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-log-'));

const chrome = spawn(chromePath, [
  '--headless=new',
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
chrome.stdout.on('data', (d) => { output += d.toString(); });

setTimeout(() => {
  chrome.kill('SIGKILL');
  console.log('Output length:', output.length);
  const lines = output.split('\n').filter(l => l.includes('extension') || l.includes('Extension') || l.includes('manifest') || l.includes('error') || l.includes('Error'));
  console.log('Filtered lines:', lines.slice(0, 30).join('\n'));
  try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch {}
}, 3000);
