import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadLogic() {
  const repo = path.resolve(process.argv[2] || '.');
  const logic = await import(pathToFileURL(path.join(repo, 'src', 'logic.js')).href);
  return { repo, ...logic };
}
export const OPTS = ['', 'E', 'D', 'C', 'B', 'A', 'S'];
export const VAL = { '': 0, E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 };
export const hands = () => OPTS.flatMap((a) => OPTS.flatMap((b) => OPTS.map((c) => [a, b, c])));
export const name = (h) => h.map((x) => x || '-').join('');
// 2 = All Clear (including "Probably"), 1 = Wave 10, 0 = neither
export const grade = (r) => (r.kind === 'stop' && /All Clear/.test(r.title) ? 2 : /^Wave 10/.test(r.title) ? 1 : 0);
export const LABEL = ['none', 'Wave 10', 'All Clear'];
