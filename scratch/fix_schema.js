const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
console.log('Reading schema from:', schemaPath);

let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// 1. Update datasource db block to add schemas
if (schemaContent.includes('datasource db {')) {
  schemaContent = schemaContent.replace(
    /datasource db \{([\s\S]*?)provider\s*=\s*"postgresql"([\s\S]*?)\}/,
    'datasource db {\n  provider = "postgresql"\n  schemas  = ["public", "auth"]\n}'
  );
}

// 2. Update generator client block to add previewFeatures
if (schemaContent.includes('generator client {')) {
  schemaContent = schemaContent.replace(
    /generator client \{([\s\S]*?)provider\s*=\s*"prisma-client-js"([\s\S]*?)\}/,
    'generator client {\n  provider        = "prisma-client-js"\n  previewFeatures = ["multiSchema"]\n}'
  );
}

// 3. Line-by-line replacement to add @@schema("public") to all models and enums safely
const lines = schemaContent.split('\n');
const newLines = [];
let inBlock = false;

for (let line of lines) {
  const trimmed = line.trim();
  
  if (trimmed.startsWith('model ') || trimmed.startsWith('enum ')) {
    inBlock = true;
  }
  
  // If we are in a block and we hit the closing brace on a line by itself
  if (inBlock && trimmed === '}') {
    newLines.push('  @@schema("public")');
    inBlock = false;
  }
  
  newLines.push(line);
}

fs.writeFileSync(schemaPath, newLines.join('\n'), 'utf8');
console.log('Schema successfully rewritten for multiSchema support (models and enums).');

// Update prisma.config.ts if it exists to add schemas
const configPath = path.resolve(__dirname, '../prisma.config.ts');
if (fs.existsSync(configPath)) {
  let configContent = fs.readFileSync(configPath, 'utf8');
  if (configContent.includes('datasource: {')) {
    configContent = configContent.replace(
      /datasource:\s*\{([\s\S]*?)url:\s*(.*?)(,?\s*)\}/,
      'datasource: {\n    url: $2,\n    schemas: ["public", "auth"],\n  }'
    );
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('Prisma config updated with schemas.');
  }
}

try {
  console.log('Running prisma db push...');
  const output = execSync('cmd /c npx prisma db push', { encoding: 'utf8' });
  console.log('Prisma db push output:\n', output);
} catch (error) {
  console.error('Error running prisma db push:', error.stdout || error.message);
}
