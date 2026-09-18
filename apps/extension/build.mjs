import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as viteBuild } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');
const outDir = path.resolve(__dirname, 'dist');

console.log(`Building JobAI Chrome Extension with Vite${isWatch ? ' (watch mode)' : ''}...`);

function verifyDist() {
  const manifestPath = path.join(outDir, 'manifest.json');
  const indexPath = path.join(outDir, 'index.html');
  const popupJsPath = path.join(outDir, 'assets', 'popup.js');
  const bgJsPath = path.join(outDir, 'background.js');

  if (!fs.existsSync(manifestPath)) {
    throw new Error('Build failed: manifest.json is missing in dist directory.');
  }
  if (!fs.existsSync(indexPath)) {
    throw new Error('Build failed: index.html is missing in dist directory.');
  }
  if (!fs.existsSync(popupJsPath)) {
    throw new Error('Build failed: assets/popup.js is missing in dist directory.');
  }
  if (!fs.existsSync(bgJsPath)) {
    throw new Error('Build failed: background.js is missing in dist directory.');
  }

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifestContent.manifest_version !== 3) {
    throw new Error('Manifest version must be 3.');
  }

  for (const size of ['16', '48', '128']) {
    const iconRel = manifestContent.icons?.[size];
    if (!iconRel || !fs.existsSync(path.join(outDir, iconRel))) {
      throw new Error(`Missing icon for size ${size}: ${iconRel}`);
    }
  }

  const jsFiles = [popupJsPath, bgJsPath];
  for (const jsFile of jsFiles) {
    const jsCode = fs.readFileSync(jsFile, 'utf8');
    if (/\beval\(/.test(jsCode)) {
      throw new Error(`CSP check failed: detected eval() in emitted JavaScript (${path.basename(jsFile)}).`);
    }
  }

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  if (/<script(?![^>]*src=)[^>]*>/i.test(indexHtml)) {
    throw new Error('CSP check failed: detected inline script in index.html.');
  }

  console.log('Extension build verified successfully:');
  console.log('- Unpacked extension directory:', outDir);
  console.log('- Manifest assets present: manifest.json, index.html, icons, assets');
  console.log('- Background service worker:', bgJsPath);
  console.log('- CSP validation passed: external script, zero unsafe-eval');
}

const buildResult = await viteBuild({
  configFile: false,
  root: __dirname,
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir,
    emptyOutDir: !isWatch,
    watch: isWatch ? {} : null,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'index.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});

if (isWatch && buildResult && typeof buildResult.on === 'function') {
  console.log('\n[Vite watch active] Watching for file changes in apps/extension...');
  console.log('[Chrome reload notice] After Vite rebuilds dist/, reload the extension in Chrome:');
  console.log('  1. Navigate to chrome://extensions');
  console.log('  2. Click the reload button on the JobAI extension card');
  buildResult.on('event', (event) => {
    if (event.code === 'BUNDLE_END') {
      try {
        verifyDist();
        console.log('[Vite watch] dist/ updated. Refresh extension in chrome://extensions.\n');
      } catch (err) {
        console.error('[Vite watch verification error]:', err.message);
      }
    }
  });
} else {
  verifyDist();
}
