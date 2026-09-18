import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {
  serializeJobHandoffUrl,
  MAX_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_COMPANY_LENGTH,
} from '../src/types.ts';

console.log('--- Testing Runtime Chrome Transfer ---');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!fs.existsSync(chromePath)) {
  console.log('Google Chrome binary not found at standard path. Reporting pending.');
  process.exit(0);
}

// 1. Create temporary HTML receiver simulating JobAI import-job receiver
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jobai-chrome-test-'));
const htmlPath = path.join(tmpDir, 'receiver.html');

const receiverHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>JobAI Receiver</title></head>
<body>
<div id="result">WAITING</div>
<script>
try {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#job=')) {
    document.getElementById('result').innerText = 'ERROR_NO_HASH';
  } else {
    const raw = hash.slice(5);
    const jsonStr = decodeURIComponent(raw);
    const job = JSON.parse(jsonStr);
    document.getElementById('result').innerText = 'SUCCESS:' + job.text.length + ':' + job.title;
  }
} catch (err) {
  document.getElementById('result').innerText = 'EXCEPTION:' + err.message;
}
</script>
</body>
</html>`;

fs.writeFileSync(htmlPath, receiverHtml, 'utf8');

try {
  // 2. Build full-size 30,000-character payload
  const maxPayload = {
    title: 'Senior Systems Architect',
    company: 'JobAI Platform Inc',
    sourceUrl: 'https://example.com/careers/lead-architect',
    text: 'A'.repeat(MAX_TEXT_LENGTH),
  };

  const fileBaseUrl = `file://${htmlPath}`;
  const serialized = serializeJobHandoffUrl(maxPayload, fileBaseUrl);
  assert.ok(serialized.url, 'Handoff URL serialization must succeed');
  console.log(`Generated handoff URL length: ${serialized.url.length.toLocaleString()} characters.`);

  // 3. Invoke headless Chrome
  console.log('Invoking Google Chrome headless to navigate to handoff URL...');
  const cmd = `"${chromePath}" --headless=new --dump-dom "${serialized.url}"`;
  const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

  assert.ok(
    output.includes(`SUCCESS:${MAX_TEXT_LENGTH}:Senior Systems Architect`),
    `Chrome must receive and decode entire 30,000 character payload without truncation. Actual output: ${output}`
  );

  console.log(`✓ Chrome successfully navigated to ${serialized.url.length.toLocaleString()} char URL and decoded full payload.`);
  console.log('✓ Nemesis 2,000 character limit hypothesis is experimentally refuted by live Chrome.');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
