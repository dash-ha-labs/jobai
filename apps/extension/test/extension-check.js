import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateJobPayload,
  serializeJobHandoffUrl,
  deserializeJobHandoffUrl,
  MAX_SOURCE_URL_LENGTH,
  MAX_HANDOFF_URL_LENGTH,
  MAX_TEXT_LENGTH,
  MIN_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_COMPANY_LENGTH,
} from '../src/types.ts';
import { extractJobFromDom } from '../src/extract.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionRoot = path.resolve(__dirname, '..');

console.log('--- Running JobAI Extension Checks ---');

// 1. Contract & Bounds Verification
console.log('1. Validating contract bounds, credentials, and error messaging...');

const validPayload = {
  title: 'Senior Software Engineer',
  company: 'Tech Corp',
  sourceUrl: 'https://example.com/jobs/123',
  text: 'A'.repeat(250), // valid length between 100 and 30000
};

assert.equal(validateJobPayload(validPayload).valid, true, 'Valid payload should pass validation');

// Missing title
const emptyTitleRes = validateJobPayload({ ...validPayload, title: '' });
assert.equal(emptyTitleRes.valid, false, 'Empty title must fail');
assert.ok(emptyTitleRes.errors.some((e) => e.includes('title is required')));

// Oversize title (>300)
const oversizeTitleRes = validateJobPayload({ ...validPayload, title: 'T'.repeat(MAX_TITLE_LENGTH + 1) });
assert.equal(oversizeTitleRes.valid, false, 'Title > 300 chars must fail');

// Company bounds
assert.equal(
  validateJobPayload({ ...validPayload, company: '' }).valid,
  true,
  'Empty company is allowed (never invent)'
);

const oversizeCompanyRes = validateJobPayload({ ...validPayload, company: 'C'.repeat(MAX_COMPANY_LENGTH + 1) });
assert.equal(oversizeCompanyRes.valid, false, 'Company > 300 chars must fail');

// Missing company property vs non-string
const missingCompanyPayload = { title: 'Test', sourceUrl: 'https://example.com', text: 'A'.repeat(100) };
const missingCompanyRes = validateJobPayload(missingCompanyPayload);
assert.equal(missingCompanyRes.valid, false, 'Missing company must fail');
assert.ok(
  missingCompanyRes.errors.some((e) => e.includes('Company field is required')),
  'Missing company produces clear required-field error message'
);

const wrongTypeCompanyRes = validateJobPayload({ ...validPayload, company: 12345 });
assert.equal(wrongTypeCompanyRes.valid, false, 'Numeric company must fail');
assert.ok(
  wrongTypeCompanyRes.errors.some((e) => e.includes('Company must be a string')),
  'Wrong type company produces type error message'
);

// Source URL protocol validation (only http/https)
assert.equal(
  validateJobPayload({ ...validPayload, sourceUrl: 'chrome://extensions' }).valid,
  false,
  'chrome:// protocol must be rejected'
);
assert.equal(
  validateJobPayload({ ...validPayload, sourceUrl: 'file:///local/path' }).valid,
  false,
  'file:// protocol must be rejected'
);
assert.equal(
  validateJobPayload({ ...validPayload, sourceUrl: 'javascript:alert(1)' }).valid,
  false,
  'javascript: protocol must be rejected'
);

// Source URL credentials rejection (username and/or password)
const userPassUrlRes = validateJobPayload({ ...validPayload, sourceUrl: 'https://admin:secret@example.com/job' });
assert.equal(userPassUrlRes.valid, false, 'URL with user and password must be rejected');
assert.ok(userPassUrlRes.errors.some((e) => e.includes('credentials')));

const userOnlyUrlRes = validateJobPayload({ ...validPayload, sourceUrl: 'https://admin@example.com/job' });
assert.equal(userOnlyUrlRes.valid, false, 'URL with username only must be rejected');
assert.ok(userOnlyUrlRes.errors.some((e) => e.includes('credentials')));

const passOnlyUrlRes = validateJobPayload({ ...validPayload, sourceUrl: 'https://:secret@example.com/job' });
assert.equal(passOnlyUrlRes.valid, false, 'URL with password only must be rejected');
assert.ok(passOnlyUrlRes.errors.some((e) => e.includes('credentials')));

// Source URL length bound (<= 4096 code units)
const maxValidUrl = 'https://example.com/jobs/' + 'a'.repeat(MAX_SOURCE_URL_LENGTH - 'https://example.com/jobs/'.length);
assert.equal(maxValidUrl.length, MAX_SOURCE_URL_LENGTH, 'Constructed URL matches max length');
assert.equal(
  validateJobPayload({ ...validPayload, sourceUrl: maxValidUrl }).valid,
  true,
  'Source URL exactly 4096 chars passes'
);

const oversizeUrl = maxValidUrl + 'x';
const oversizeUrlRes = validateJobPayload({ ...validPayload, sourceUrl: oversizeUrl });
assert.equal(oversizeUrlRes.valid, false, 'Source URL > 4096 chars must fail');
assert.ok(oversizeUrlRes.errors.some((e) => e.includes('4,096')));

// Text bounds (100 .. 30000)
assert.equal(
  validateJobPayload({ ...validPayload, text: 'Short job text' }).valid,
  false,
  'Text < 100 chars must fail'
);
assert.equal(
  validateJobPayload({ ...validPayload, text: 'X'.repeat(MIN_TEXT_LENGTH) }).valid,
  true,
  'Text exactly 100 chars passes'
);
assert.equal(
  validateJobPayload({ ...validPayload, text: 'X'.repeat(MAX_TEXT_LENGTH) }).valid,
  true,
  'Text exactly 30000 chars passes'
);
assert.equal(
  validateJobPayload({ ...validPayload, text: 'X'.repeat(MAX_TEXT_LENGTH + 1) }).valid,
  false,
  'Text > 30000 chars must fail'
);

// UTF-16 code units length semantics check (standard JS .length)
const emojiText = '🎯'.repeat(50) + 'A'.repeat(50); // 50 * 2 + 50 = 150 UTF-16 code units
assert.equal(emojiText.length, 150);
assert.equal(
  validateJobPayload({ ...validPayload, text: emojiText }).valid,
  true,
  'UTF-16 code units used for length validation'
);

console.log('✓ Contract bounds, credentials, and error messaging verified.');

// 2. Encoded payload roundtrip and safety bounds
console.log('2. Validating payload roundtrip serialization, Unicode, and safety bounds...');

// Standard payload roundtrip
const stdHandoff = serializeJobHandoffUrl(validPayload);
assert.ok(stdHandoff.url, 'Standard payload serialization succeeds');
const stdRoundtrip = deserializeJobHandoffUrl(stdHandoff.url);
assert.ok(stdRoundtrip.job, 'Standard payload deserialization succeeds');
assert.deepEqual(stdRoundtrip.job, validPayload, 'Roundtrip payload matches original exactly');

// Max 30,000 char ASCII text payload roundtrip
const maxAsciiPayload = {
  title: 'T'.repeat(MAX_TITLE_LENGTH),
  company: 'C'.repeat(MAX_COMPANY_LENGTH),
  sourceUrl: maxValidUrl,
  text: 'X'.repeat(MAX_TEXT_LENGTH),
};
const maxAsciiHandoff = serializeJobHandoffUrl(maxAsciiPayload);
assert.ok(maxAsciiHandoff.url, 'Max ASCII payload serialization succeeds');
assert.ok(
  maxAsciiHandoff.url.length <= MAX_HANDOFF_URL_LENGTH,
  `Max ASCII handoff URL length (${maxAsciiHandoff.url.length}) is within 400,000 bound`
);
const maxAsciiRoundtrip = deserializeJobHandoffUrl(maxAsciiHandoff.url);
assert.ok(maxAsciiRoundtrip.job, 'Max ASCII payload deserializes successfully');
assert.deepEqual(maxAsciiRoundtrip.job, maxAsciiPayload, 'Max ASCII roundtrip matches original exactly');

// Max Unicode text (CJK + emojis) roundtrip
const unicodeBlock = '日本語テキストと絵文字🚀🎯💡';
const repeatCount = Math.floor(MAX_TEXT_LENGTH / unicodeBlock.length);
const remainder = MAX_TEXT_LENGTH - repeatCount * unicodeBlock.length;
const maxUnicodeText = unicodeBlock.repeat(repeatCount) + 'U'.repeat(remainder);
assert.equal(maxUnicodeText.length, MAX_TEXT_LENGTH);

const maxUnicodePayload = {
  title: 'Senior AI Engineer 🚀',
  company: 'Global AI 日本',
  sourceUrl: 'https://example.com/jobs/unicode',
  text: maxUnicodeText,
};
const maxUnicodeHandoff = serializeJobHandoffUrl(maxUnicodePayload);
assert.ok(maxUnicodeHandoff.url, 'Max Unicode payload serialization succeeds');
assert.ok(
  maxUnicodeHandoff.url.length <= MAX_HANDOFF_URL_LENGTH,
  `Max Unicode handoff URL length (${maxUnicodeHandoff.url.length}) is within 400,000 bound`
);
const maxUnicodeRoundtrip = deserializeJobHandoffUrl(maxUnicodeHandoff.url);
assert.ok(maxUnicodeRoundtrip.job, 'Max Unicode payload deserializes successfully');
assert.deepEqual(maxUnicodeRoundtrip.job, maxUnicodePayload, 'Max Unicode roundtrip matches original exactly');

// Oversize handoff safety bound (> 400,000 chars) check
// Create a hypothetical oversize text that passes text validation (30000 chars) but when URI-encoded with repeated 4-byte glyphs exceeds 400000 chars
const heavyGlyph = '𠮷'; // 2 code units, encodes to %F0%A0%AE%B7 (12 chars) -> expansion factor 6x
const heavyText = heavyGlyph.repeat(15000); // 30,000 code units, URI-encodes to ~180,000 chars
// To exceed 400,000 chars, let's test serializeJobHandoffUrl with a small custom limit or verify safety bound
const testJob = { ...validPayload };
const oversizeBaseUrl = 'http://localhost:3000/import-job?' + 'p='.repeat(200000);
const oversizeHandoffRes = serializeJobHandoffUrl(testJob, oversizeBaseUrl);
assert.ok(
  oversizeHandoffRes.error && oversizeHandoffRes.error.includes('exceeds safety limit of 400,000'),
  'Handoff URL > 400,000 chars returns actionable error and never silently truncates'
);

// Deserialization error handling
assert.ok(deserializeJobHandoffUrl('http://localhost:3000/import-job').error?.includes('does not contain #job='));
assert.ok(deserializeJobHandoffUrl('http://localhost:3000/import-job#job=%ZZinvalid').error?.includes('Failed to deserialize'));
assert.ok(deserializeJobHandoffUrl('http://localhost:3000/import-job#job=not-json').error?.includes('Failed to deserialize'));

console.log('✓ Encoded payload roundtrip, Unicode handling, and safety bounds verified.');

// 3. Extraction URL credentials rejection check
console.log('3. Validating credential rejection in DOM extraction...');
// Set up global window / location mock to exercise extractJobFromDom
const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

try {
  globalThis.window = {
    location: {
      href: 'https://user:pass@example.com/job-post',
      protocol: 'https:',
    },
  };
  globalThis.document = {
    title: 'Test',
    querySelector: () => null,
    body: { cloneNode: () => ({ querySelectorAll: () => [], innerText: 'A'.repeat(200) }) },
  };

  const credExtractRes = extractJobFromDom();
  assert.equal(credExtractRes.ok, false, 'Extraction must fail for URL with credentials');
  assert.ok(credExtractRes.error?.includes('credentials'), 'Error must mention credentials');

  // Test URL exceeding 4096
  globalThis.window.location.href = 'https://example.com/' + 'x'.repeat(4100);
  const longUrlExtractRes = extractJobFromDom();
  assert.equal(longUrlExtractRes.ok, false, 'Extraction must fail for URL > 4096 chars');
  assert.ok(longUrlExtractRes.error?.includes('4,096'), 'Error must mention 4,096 character limit');
} finally {
  globalThis.window = originalWindow;
  globalThis.document = originalDocument;
}

console.log('✓ Extraction credential rejection and bounds verified.');

// 4. Clean-checkout reproducibility check (no machine paths)
console.log('4. Verifying clean-checkout build script portability...');
const buildMjsContent = fs.readFileSync(path.join(extensionRoot, 'build.mjs'), 'utf8');
const checkMjsContent = fs.readFileSync(path.join(extensionRoot, 'check.mjs'), 'utf8');

assert.ok(!buildMjsContent.includes('/Users/'), 'build.mjs must not contain machine-specific /Users/ path');
assert.ok(!buildMjsContent.includes('Herd/config/nvm'), 'build.mjs must not contain machine-specific nvm/Herd path');
assert.ok(!buildMjsContent.includes('.npm/_npx'), 'build.mjs must not contain machine-specific npx cache path');

assert.ok(!checkMjsContent.includes('/Users/'), 'check.mjs must not contain machine-specific /Users/ path');
assert.ok(!checkMjsContent.includes('.npm/_npx'), 'check.mjs must not contain machine-specific npx cache path');

console.log('✓ Build scripts contain zero machine-specific absolute paths.');

// 5. Manifest & Assets Verification
console.log('5. Validating extension manifest and assets...');
const manifestPath = path.join(extensionRoot, 'public', 'manifest.json');
assert.ok(fs.existsSync(manifestPath), 'manifest.json exists in public/');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.equal(manifest.manifest_version, 3, 'Must use Manifest V3');
assert.ok(Array.isArray(manifest.permissions), 'Permissions must be an array');
assert.deepEqual(
  manifest.permissions.sort(),
  ['activeTab', 'scripting', 'storage'],
  'Permissions must be restricted strictly to activeTab, scripting, and storage'
);
assert.ok(
  Array.isArray(manifest.host_permissions),
  'Host permissions must be specified'
);
assert.deepEqual(
  manifest.host_permissions.sort(),
  ['http://127.0.0.1:3000/*', 'http://localhost:3000/*'],
  'Host permissions must be restricted strictly to exact local backend'
);
assert.equal(manifest.background?.service_worker, 'background.js', 'Background service worker configured at root');
assert.equal(manifest.background?.type, 'module', 'Background service worker configured with type module');
assert.equal(manifest.action?.default_popup, 'index.html', 'Default popup must be index.html');

for (const size of ['16', '48', '128']) {
  const iconRel = manifest.icons?.[size];
  assert.ok(iconRel, `Icon ${size} defined in manifest`);
  const iconPath = path.join(extensionRoot, 'public', iconRel);
  assert.ok(fs.existsSync(iconPath), `Icon file exists at ${iconPath}`);
}
console.log('✓ Manifest V3 and asset paths verified.');

// 6. Emitted build output verification in dist/
console.log('6. Validating emitted build output in dist/...');
const distDir = path.join(extensionRoot, 'dist');
assert.ok(fs.existsSync(distDir), 'dist/ directory exists');

const distManifest = path.join(distDir, 'manifest.json');
assert.ok(fs.existsSync(distManifest), 'dist/manifest.json exists');

const distIndex = path.join(distDir, 'index.html');
assert.ok(fs.existsSync(distIndex), 'dist/index.html exists');
const distIndexHtml = fs.readFileSync(distIndex, 'utf8');
assert.ok(!distIndexHtml.includes('<script>') && !distIndexHtml.includes('<script type="text/javascript">'), 'No inline scripts in dist/index.html');
assert.ok(distIndexHtml.includes('popup.js'), 'dist/index.html references external popup.js bundle');

const distPopupJs = path.join(distDir, 'assets', 'popup.js');
assert.ok(fs.existsSync(distPopupJs), 'dist/assets/popup.js exists');
const jsCode = fs.readFileSync(distPopupJs, 'utf8');
assert.ok(!/\beval\(/.test(jsCode), 'No eval() statements in popup.js (CSP safe)');

const distBgJs = path.join(distDir, 'background.js');
assert.ok(fs.existsSync(distBgJs), 'dist/background.js exists at root');
const bgCode = fs.readFileSync(distBgJs, 'utf8');
assert.ok(!/\beval\(/.test(bgCode), 'No eval() statements in background.js (CSP safe)');
assert.ok(bgCode.includes('chrome.runtime.onMessage.addListener'), 'background.js registers message listener');

console.log('✓ Build outputs and CSP compliance verified.');
console.log('\nAll checks passed successfully.');
