import { readFile, stat } from 'node:fs/promises';

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'vitest.config.ts',
  'playwright.config.ts',
  'eslint.config.js',
  'index.html',
  'src/main.tsx',
  'src/app/App.tsx',
  'src/app/App.test.tsx',
  'src/test/setup.ts',
  'e2e/smoke.spec.ts',
];

for (const file of requiredFiles) {
  const fileStat = await stat(file);
  if (!fileStat.isFile()) {
    throw new Error(`Required path is not a file: ${file}`);
  }
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const requiredScripts = ['lint', 'typecheck', 'test', 'test:coverage', 'test:e2e', 'build'];

for (const script of requiredScripts) {
  if (typeof packageJson.scripts?.[script] !== 'string') {
    throw new Error(`Missing required npm script: ${script}`);
  }
}

if (packageJson.dependencies?.react !== packageJson.dependencies?.['react-dom']) {
  throw new Error('react and react-dom must use the same baseline version.');
}

console.log(
  `Repository baseline OK: ${requiredFiles.length} runtime files, ${requiredScripts.length} quality scripts.`,
);
