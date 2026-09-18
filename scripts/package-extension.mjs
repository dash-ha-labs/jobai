// Package apps/extension/dist into apps/web/public/downloads/jobai-extension.zip
// Node stdlib only (STORE method, no compression). Fails if the extension
// build is absent or the archive would contain anything outside the
// installable layout. Run: node scripts/package-extension.mjs
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'apps/extension/dist');
const outDir = path.join(repoRoot, 'apps/web/public/downloads');
const zipPath = path.join(outDir, 'jobai-extension.zip');

const files = [];
function walk(rel = '') {
  for (const e of fs.readdirSync(rel ? path.join(distDir, rel) : distDir, { withFileTypes: true })) {
    const entry = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(entry);
    else if (e.isFile()) files.push(entry);
    else fail(`unexpected non-file entry in dist: ${entry}`);
  }
}

function fail(msg) {
  console.error(`package-extension: ${msg}`);
  process.exit(1);
}

walk();

// Installable layout assertions: manifest at archive root, sources and
// credentials never shipped.
if (!files.includes('manifest.json')) {
  fail('dist/manifest.json missing — run: npm run build -w apps/extension');
}
for (const banned of ['node_modules', 'src', 'CV', 'keys', '.env']) {
  if (files.some((f) => f === banned || f.startsWith(`${banned}/`) || f.includes(`/${banned}/`))) {
    fail(`forbidden content in dist: ${banned}`);
  }
}

// A stale/empty manifest would look installable but break Load unpacked.
const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) fail('manifest.json is not manifest_version 3');
for (const rel of Object.values(manifest.icons ?? {})) {
  if (!files.includes(rel)) fail(`manifest references missing icon: ${rel}`);
}
if (!files.includes(manifest.action?.default_popup ?? '')) fail('manifest action.default_popup missing from dist');

// --- Minimal ZIP writer (STORE) ---
const table = (() => {
  const t = new Int32Array(256).map((_, i) => i);
  for (let i = 0; i < 256; i++) {
    let c = t[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const dosTime = (d) => ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xffff;
const dosDate = (d) => (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;

const now = new Date();
const locals = [];
const centrals = [];
let offset = 0;
for (const name of files.sort()) {
  const data = fs.readFileSync(path.join(distDir, name));
  const comp = zlib.deflateRawSync(data);
  const useDeflate = comp.length < data.length;
  const payload = useDeflate ? comp : data;
  const nameBuf = Buffer.from(name, 'utf8');
  const crc = crc32(data);
  const h = Buffer.alloc(30);
  h.writeUInt32LE(0x04034b50, 0);
  h.writeUInt16LE(20, 4); // version needed
  h.writeUInt16LE(0x0800, 6); // UTF-8 names
  h.writeUInt16LE(useDeflate ? 8 : 0, 8);
  h.writeUInt16LE(dosTime(now), 10);
  h.writeUInt16LE(dosDate(now), 12);
  h.writeUInt32LE(crc, 14);
  h.writeUInt32LE(payload.length, 18);
  h.writeUInt32LE(data.length, 22);
  h.writeUInt16LE(nameBuf.length, 26);
  h.writeUInt16LE(0, 28);
  locals.push(h, nameBuf, payload);
  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50, 0);
  c.writeUInt16LE(20, 4);
  c.writeUInt16LE(20, 6);
  c.writeUInt16LE(0x0800, 8);
  c.writeUInt16LE(useDeflate ? 8 : 0, 10);
  c.writeUInt16LE(dosTime(now), 12);
  c.writeUInt16LE(dosDate(now), 14);
  c.writeUInt32LE(crc, 16);
  c.writeUInt32LE(payload.length, 20);
  c.writeUInt32LE(data.length, 24);
  c.writeUInt16LE(nameBuf.length, 28);
  c.writeUInt32LE(offset, 42);
  centrals.push(Buffer.concat([c, nameBuf]));
  offset += 30 + nameBuf.length + payload.length;
}
const centralDir = Buffer.concat(centrals);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(files.length, 8);
eocd.writeUInt16LE(files.length, 10);
eocd.writeUInt32LE(centralDir.length, 12);
eocd.writeUInt32LE(offset, 16);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(zipPath, Buffer.concat([...locals, centralDir, eocd]));

// --- Archive list + verify round-trip ---
const written = fs.readFileSync(zipPath);
let p = 0;
const listed = [];
while (written.readUInt32LE(p) === 0x04034b50) {
  const method = written.readUInt16LE(p + 8);
  const compSize = written.readUInt32LE(p + 18);
  const nameLen = written.readUInt16LE(p + 26);
  const extraLen = written.readUInt16LE(p + 28);
  const name = written.toString('utf8', p + 30, p + 30 + nameLen);
  const payload = written.subarray(p + 30 + nameLen + extraLen, p + 30 + nameLen + extraLen + compSize);
  const raw = method === 8 ? zlib.inflateRawSync(payload) : payload;
  if (crc32(raw) !== written.readUInt32LE(p + 14)) fail(`CRC mismatch re-reading ${name}`);
  listed.push(name);
  p += 30 + nameLen + extraLen + compSize;
}
if (listed.length !== files.length) fail(`entry count ${listed.length} != ${files.length}`);
if (!listed.includes('manifest.json')) fail('manifest.json not at archive root');

console.log(`packaged ${listed.length} entries -> ${zipPath}`);
console.log(`archive size: ${written.length} bytes`);
for (const n of listed) console.log(`  ${n}`);
