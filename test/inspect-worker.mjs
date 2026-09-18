import fs from 'node:fs';
import path from 'node:path';

const bgPath = path.resolve('apps/extension/dist/assets/background.js');
const content = fs.readFileSync(bgPath, 'utf8');

console.log('Background file size:', content.length);
console.log('Background contains import:', content.includes('import '));
console.log('Background contains export:', content.includes('export '));

// Split into statements or print readable preview
console.log('--- Background content preview ---');
console.log(content.slice(0, 500));
console.log('--- End of Background content ---');
console.log(content.slice(-500));
