// Runnable self-check for shared types and persistence
// Run: node test/self-check.js

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

console.log("Self-check: types + persistence logic\n" + "=".repeat(50) + "\n");

// Check 1: types.ts has required exports
const typesPath = path.join(ROOT, "packages/shared/src/types.ts");
const typesContent = fs.readFileSync(typesPath, "utf8");

const checks = [
  { name: "CV schema with version", pattern: /CV[\s\S]*version[\s\S]*string/ },
  { name: "CVSection type", pattern: /CVSection/ },
  { name: "JobMetadata type", pattern: /JobMetadata/ },
  { name: "Contact type", pattern: /contact.*object/ },
  { name: "Section types enum", pattern: /"experience"|"education"|"skills"/ },
];

let passed = 0;
let failed = 0;

checks.forEach((c) => {
  const ok = c.pattern.test(typesContent);
  console.log(`${ok ? "✓" : "✗"} ${c.name}`);
  if (ok) passed++; else failed++;
});

// Check 2: persistence.ts has required functions
const persistPath = path.join(ROOT, "packages/shared/src/persistence.ts");
const persistContent = fs.readFileSync(persistPath, "utf8");

const persistChecks = [
  { name: "loadMasterCV", pattern: /function loadMasterCV/ },
  { name: "saveMasterCV", pattern: /function saveMasterCV/ },
  { name: "loadDrafts", pattern: /function loadDrafts/ },
  { name: "saveDraft", pattern: /function saveDraft/ },
  { name: "deleteDraft", pattern: /function deleteDraft/ },
];

persistChecks.forEach((c) => {
  const ok = c.pattern.test(persistContent);
  console.log(`${ok ? "✓" : "✗"} ${c.name}`);
  if (ok) passed++; else failed++;
});

// Check 3: index.ts exports
const indexPath = path.join(ROOT, "packages/shared/index.ts");
const indexContent = fs.readFileSync(indexPath, "utf8");

const exportChecks = [
  { name: "exports types", pattern: /export.*types/ },
  { name: "exports persistence", pattern: /export.*persistence/ },
  { name: "exports contracts", pattern: /export.*contracts/ },
];

exportChecks.forEach((c) => {
  const ok = c.pattern.test(indexContent);
  console.log(`${ok ? "✓" : "✗"} ${c.name}`);
  if (ok) passed++; else failed++;
});

console.log("\n" + "=".repeat(50));
console.log(`Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}

console.log("\n✓ All checks passed");
