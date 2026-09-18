import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extDir = path.resolve('apps/extension/dist');
const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-debug-'));

const chrome = spawn(chromePath, [
  '--headless=new',
  '--enable-logging=stderr',
  '--v=1',
  '--remote-debugging-port=9337',
  `--user-data-dir=${tmpUserData}`,
  `--load-extension=${extDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let stderr = '';
chrome.stderr.on('data', (d) => { stderr += d.toString(); });

async function run() {
  await new Promise((r) => setTimeout(r, 2000));
  const lines = stderr.split('\n').filter(l => l.includes('load-extension') || l.includes('JobAI') || l.includes('extension/dist') || l.includes('Failed to load'));
  console.log('Filtered lines for load-extension:', lines);
  chrome.kill('SIGKILL');
  setTimeout(() => {
    try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch {}
  }, 500);
}

run();
