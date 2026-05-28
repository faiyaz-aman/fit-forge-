const fs = require('fs');

const logPath = 'C:\\Users\\RBSK\\.gemini\\antigravity\\brain\\9f29dd71-1fcc-4dd9-b2e4-89ff87576c1b\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log("Log file does not exist");
  process.exit(1);
}

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

try {
  const step = JSON.parse(lines[197]);
  console.log("\n=== FULL CONTENT OF STEP 197 ===");
  console.log(step.content);
} catch (e) {
  console.error("Error parsing step 197:", e);
}
