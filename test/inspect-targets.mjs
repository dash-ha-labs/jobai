import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extDir = path.resolve('apps/extension/dist');
const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-debug-'));

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9335',
  `--user-data-dir=${tmpUserData}`,
  `--disable-extensions-except=${extDir}`,
  `--load-extension=${extDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], {
  stdio: ['ignore', 'pipe', 'pipe']
});

async function run() {
  await new Promise((r) => setTimeout(r, 2000));
  try {
    const res = await fetch('http://127.0.0.1:9335/json');
    const targets = await res.json();
    console.log(JSON.stringify(targets, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    chrome.kill('SIGKILL');
    setTimeout(() => {
      try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch {}
    }, 500);
  }
}

run();
