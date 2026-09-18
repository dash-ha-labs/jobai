// Verifies jobai-extension.zip round-trips with Node stdlib zlib and has an
// installable layout. Standalone runnable: node scripts/verify-extension-zip.mjs
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const zipPath = path.join(repoRoot, 'apps/web/public/downloads/jobai-extension.zip');
if (!fs.existsSync(zipPath)) {
  console.error('verify: jobai-extension.zip not found — run scripts/package-extension.mjs');
  process.exit(1);
}

function fail(msg) {
  console.error(`verify: ${msg}`);
  process.exit(1);
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();
function crc32Check(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

const buf = fs.readFileSync(zipPath);
if (buf.readUInt32LE(0) !== 0x04034b50) fail('not a ZIP (bad local header)');

const listed = [];
let p = 0;
while (p + 30 <= buf.length && buf.readUInt32LE(p) === 0x04034b50) {
  const method = buf.readUInt16LE(p + 8);
  const crc = buf.readUInt32LE(p + 14);
  const compSize = buf.readUInt32LE(p + 18);
  const uncompSize = buf.readUInt32LE(p + 22);
  const nameLen = buf.readUInt16LE(p + 26);
  const extraLen = buf.readUInt16LE(p + 28);
  const name = buf.toString('utf8', p + 30, p + 30 + nameLen);
  const payload = buf.subarray(p + 30 + nameLen + extraLen, p + 30 + nameLen + extraLen + compSize);
  const raw = method === 8 ? zlib.inflateRawSync(payload) : Buffer.from(payload);
  if (raw.length !== uncompSize) fail(`size mismatch for ${name}`);
  if (crc32Check(raw) !== crc) fail(`crc mismatch for ${name}`);
  listed.push(name);
  p += 30 + nameLen + extraLen + compSize;
}

if (listed.length === 0) fail('no entries found');
if (!listed.includes('manifest.json')) fail('manifest.json is not at archive root');
for (const banned of ['node_modules', 'src/', 'CV/', 'keys/', '.env']) {
  if (listed.some((n) => n.startsWith(banned))) fail(`forbidden content in archive: ${banned}`);
}

console.log(`verify OK: ${listed.length} entries round-trip with correct CRC/size`);
for (const n of listed) console.log(`  ${n}`);
