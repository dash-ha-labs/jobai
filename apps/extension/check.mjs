import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let tscPath;
try {
  tscPath = require.resolve('typescript/bin/tsc');
} catch {
  const localTsc = path.join(__dirname, 'node_modules', '.bin', 'tsc');
  if (fs.existsSync(localTsc)) {
    tscPath = localTsc;
  }
}

if (!tscPath) {
  console.error('TypeScript compiler (tsc) not found. Please ensure dependencies are installed via npm install.');
  process.exit(1);
}

console.log('Running TypeScript typecheck in apps/extension...');
try {
  execSync(`node "${tscPath}" --project tsconfig.json --noEmit`, {
    cwd: __dirname,
    stdio: 'inherit',
  });
  console.log('TypeScript typecheck passed with 0 errors.');
} catch (err) {
  console.error('TypeScript typecheck failed.');
  process.exit(1);
}
