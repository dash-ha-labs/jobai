import fs from 'node:fs';
import path from 'node:path';

const bgPath = path.resolve('apps/extension/dist/assets/background.js');
const content = fs.readFileSync(bgPath, 'utf8');

// Print with newlines after semicolons and braces to make it human-readable
let formatted = content.replace(/;/g, ';\n').replace(/\{/g, '{\n').replace(/\}/g, '\n}\n');
fs.writeFileSync('test/formatted-background.js', formatted);
console.log('Formatted written to test/formatted-background.js');
