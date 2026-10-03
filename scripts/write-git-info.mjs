import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const outDir = new URL('../src/generated/', import.meta.url);
const outFile = new URL('git-info.js', outDir);

let commitTime = new Date().toISOString();
let commitMessage = '';

try {
  const [time, ...message] = execSync('git log -1 --format=%cI%n%s', { cwd: root, encoding: 'utf8' })
    .trimEnd()
    .split('\n');
  commitTime = time;
  commitMessage = message.join('\n');
} catch {
  commitTime = new Date().toISOString();
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, `export const gitCommitTime = ${JSON.stringify(commitTime)};\nexport const gitCommitMessage = ${JSON.stringify(commitMessage)};\n`);
