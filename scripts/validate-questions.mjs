// Validates the Followup question graph. Run with: npm run validate
// (requires Node 22+ for --experimental-strip-types)
//
// Checks:
// 1. Every branch/next target exists in the same category
// 2. Branch keys match actual choices (or Yes/No for yesno)
// 3. Branch and next targets only jump forward (backward jumps would loop)
// 4. Simulates every combination of branch answers: the interview always
//    terminates, never loops, and every question is reachable on some path
// 5. urgentAlert.on values are real answers for the question they're attached to
//
// lib/questions.ts imports './types' without an extension, which Node's
// TS-stripping loader can't resolve — so we copy both files to a temp dir
// with fixed imports and import from there.

import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'followup-validate-'));

writeFileSync(join(tmp, 'types.ts'), readFileSync(join(root, 'lib', 'types.ts'), 'utf8'));
writeFileSync(
  join(tmp, 'questions.ts'),
  readFileSync(join(root, 'lib', 'questions.ts'), 'utf8')
    .replace("import { Category } from './types'", "import type { Category } from './types.ts'")
);

const { categories, preambleQuestions } = await import(
  pathToFileURL(join(tmp, 'questions.ts')).href
);

let errors = 0;
const err = (msg) => { console.log('ERROR: ' + msg); errors++; };

for (const cat of categories) {
  const qs = [...preambleQuestions, ...cat.questions];
  const ids = new Set(qs.map(q => q.id));
  const idx = new Map(qs.map((q, i) => [q.id, i]));

  if (ids.size !== qs.length) err(`${cat.id}: duplicate question ids`);

  for (const q of qs) {
    const validAnswers = q.answerType === 'yesno' ? ['Yes', 'No'] : (q.choices || []);

    if (q.next && !ids.has(q.next)) err(`${cat.id}/${q.id}: next -> missing '${q.next}'`);
    if (q.next && idx.get(q.next) <= idx.get(q.id)) err(`${cat.id}/${q.id}: next jumps backward`);

    if (q.branches) {
      for (const [key, target] of Object.entries(q.branches)) {
        if (!ids.has(target)) err(`${cat.id}/${q.id}: branch '${key}' -> missing '${target}'`);
        else if (idx.get(target) <= idx.get(q.id)) err(`${cat.id}/${q.id}: branch '${key}' jumps backward to '${target}'`);
        if (!validAnswers.includes(key)) err(`${cat.id}/${q.id}: branch key '${key}' is not a valid answer`);
      }
    }

    if (q.urgentAlert) {
      if (q.answerType === 'freetext') err(`${cat.id}/${q.id}: urgentAlert on a freetext question can never match`);
      for (const on of q.urgentAlert.on) {
        if (!validAnswers.includes(on)) err(`${cat.id}/${q.id}: urgentAlert.on '${on}' is not a valid answer`);
      }
      if (!q.urgentAlert.message?.trim()) err(`${cat.id}/${q.id}: urgentAlert has an empty message`);
    }
  }

  // simulate all branch-answer combinations
  const everVisited = new Set();
  let paths = 0;
  const walk = (i, visited) => {
    if (i >= qs.length) { paths++; return; }
    const q = qs[i];
    if (visited.has(q.id)) { err(`${cat.id}: loop at ${q.id}`); return; }
    const v = new Set(visited); v.add(q.id); everVisited.add(q.id);
    const nextIdx = (target) => (idx.has(target) ? idx.get(target) : qs.length);
    if (q.branches) {
      const answerSet = q.answerType === 'yesno' ? ['Yes', 'No'] : (q.choices || []);
      for (const a of answerSet) {
        const target = q.branches[a];
        walk(target ? nextIdx(target) : (q.next ? nextIdx(q.next) : i + 1), v);
      }
    } else if (q.next) {
      walk(nextIdx(q.next), v);
    } else {
      walk(i + 1, v);
    }
  };
  walk(0, new Set());

  const unreachable = qs.filter(q => !everVisited.has(q.id)).map(q => q.id);
  if (unreachable.length) err(`${cat.id}: unreachable questions: ${unreachable.join(', ')}`);

  const alerts = cat.questions.filter(q => q.urgentAlert).length;
  console.log(`${cat.id}: ${cat.questions.length} questions, ${paths} paths, ${alerts} red-flag alert(s)`);
}

rmSync(tmp, { recursive: true, force: true });
console.log(errors === 0 ? '\nALL CHECKS PASSED' : `\n${errors} ERROR(S) FOUND`);
process.exit(errors === 0 ? 0 : 1);
