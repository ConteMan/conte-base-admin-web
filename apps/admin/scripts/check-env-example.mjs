import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(currentDir, '..');

const sourceRoots = [path.join(appRoot, 'src')];
const explicitFiles = [path.join(appRoot, 'vite.config.mts')];
const allowedExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.mjs',
  '.vue',
]);

function walkFiles(dir, output) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, output);
      continue;
    }
    if (!allowedExtensions.has(path.extname(fullPath))) {
      continue;
    }
    output.push(fullPath);
  }
}

function collectUsedEnvKeys(files) {
  const keySet = new Set();
  const pattern = /\b(?:import\.meta\.env|process\.env)\.([A-Z][A-Z0-9_]*)\b/g;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(pattern)) {
      const key = match[1];
      if (!key) {
        continue;
      }
      if (key.startsWith('VITE_') || key.startsWith('SENTRY_')) {
        keySet.add(key);
      }
    }
  }
  return keySet;
}

function collectExampleKeys() {
  const content = readFileSync(path.join(appRoot, '.env.example'), 'utf8');
  const keys = new Set();
  const linePattern = /^\s*([A-Z][A-Z0-9_]*)\s*=/gm;
  for (const match of content.matchAll(linePattern)) {
    if (match[1]) {
      keys.add(match[1]);
    }
  }
  return keys;
}

const files = [];
for (const root of sourceRoots) {
  walkFiles(root, files);
}
for (const explicitFile of explicitFiles) {
  if (statSync(explicitFile).isFile()) {
    files.push(explicitFile);
  }
}

const usedKeys = collectUsedEnvKeys(files);
const exampleKeys = collectExampleKeys();
const missing = [...usedKeys].filter((key) => !exampleKeys.has(key)).sort();

if (missing.length > 0) {
  console.error('.env.example 缺少以下环境变量：');
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log(`.env.example 校验通过，共覆盖 ${usedKeys.size} 个环境变量引用。`);
