// Runnable self-check for shared types and persistence
// Executes actual contract and schema verification suite

const { execSync } = require("child_process");

console.log("Self-check: Executing real foundation contract tests...\n" + "=".repeat(50) + "\n");

try {
  const out = execSync("npx tsx test/contract-check.js", { stdio: "inherit" });
  console.log("\n✓ Foundation self-check passed: All behavioral contracts verified.");
  process.exit(0);
} catch (err) {
  console.error("\n✗ Foundation self-check failed:", err.message);
  process.exit(1);
}
