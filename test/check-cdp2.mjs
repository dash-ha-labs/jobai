import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extDir = path.resolve('apps/extension/dist');
const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-debug-'));

console.log('Testing extDir:', extDir);
console.log('Manifest exists in extDir:', fs.existsSync(path.join(extDir, 'manifest.json')));

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9334',
  `--user-data-dir=${tmpUserData}`,
  `--disable-extensions-except=${extDir}`,
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
  await new Promise((r) => setTimeout(r, 2500));
  try {
    const res = await fetch('http://127.0.0.1:9334/json');
    const targets = await res.json();
    console.log('Targets count:', targets.length);
    for (const t of targets) {
      console.log(`- Type: ${t.type}, Title: ${t.title}, URL: ${t.url}`);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  } finally {
    chrome.kill('SIGKILL');
    setTimeout(() => {
      try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch {}
    }, 500);
    console.log('Done.');
  }
}

run();
