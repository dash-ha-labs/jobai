import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extDir = path.resolve('apps/extension/dist');

console.log('Testing Chrome with extension:', extDir);
const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));

try {
  const cmd = `"${chromePath}" --headless=new --user-data-dir="${tmpUserData}" --disable-extensions-except="${extDir}" --load-extension="${extDir}" --dump-dom "about:blank"`;
  console.log('Running cmd:', cmd);
  const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  console.log('Output length:', output.length);
  console.log('Output preview:', output.slice(0, 300));
} catch (err) {
  console.error('Error running Chrome:', err.message);
  if (err.stdout) console.log('stdout:', err.stdout);
  if (err.stderr) console.log('stderr:', err.stderr);
} finally {
  fs.rmSync(tmpUserData, { recursive: true, force: true });
}
