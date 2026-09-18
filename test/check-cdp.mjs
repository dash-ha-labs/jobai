import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extDir = path.resolve('apps/extension/dist');
const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-debug-'));

console.log('Starting Chrome with debugging port 9333...');
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9333',
  `--user-data-dir=${tmpUserData}`,
  `--disable-extensions-except=${extDir}`,
  `--load-extension=${extDir}`,
  'about:blank',
], {
  stdio: ['ignore', 'pipe', 'pipe']
});

chrome.stderr.on('data', (d) => {
  const msg = d.toString();
  if (!msg.includes('DevTools listening')) {
    console.log('[chrome stderr]', msg.trim());
  }
});

async function run() {
  // Wait 2 seconds for Chrome to start
  await new Promise((r) => setTimeout(r, 2000));
  try {
    const res = await fetch('http://127.0.0.1:9333/json');
    const targets = await res.json();
    console.log('Chrome targets count:', targets.length);
    console.log('Targets:', JSON.stringify(targets, null, 2));
  } catch (err) {
    console.error('Fetch error:', err.message);
  } finally {
    chrome.kill('SIGKILL');
    fs.rmSync(tmpUserData, { recursive: true, force: true });
    console.log('Cleaned up.');
  }
}

run();
