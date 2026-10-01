import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const outDir = new URL('../src/generated/', import.meta.url);
const outFile = new URL('git-info.js', outDir);

let commitTime = new Date().toISOString();

try {
  commitTime = execSync('git log -1 --format=%cI', { cwd: root, encoding: 'utf8' }).trim();
} catch {
  commitTime = new Date().toISOString();
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, `export const gitCommitTime = ${JSON.stringify(commitTime)};\n`);
