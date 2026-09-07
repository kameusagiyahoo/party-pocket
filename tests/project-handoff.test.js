import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const handoff=fs.readFileSync('PROJECT_HANDOFF.md','utf8');
const agents=fs.readFileSync('AGENTS.md','utf8');

test('persistent handoff matches the current Party Pocket identity',()=>{
  assert.match(handoff,/kameusagiyahoo\/party-pocket/);
  assert.match(handoff,/kameusagiyahoo\.github\.io\/party-pocket\//);
  assert.match(agents,/kameusagiyahoo\/party-pocket/);
  assert.match(agents,/PROJECT_HANDOFF\.md/);
});

test('persistent handoff version matches package.json',()=>{
  assert.match(handoff,new RegExp(`Current app/package version: \\`${pkg.version.replaceAll('.','\\.')}\\``));
});

test('handoff documents the resume workflow and next-task source of truth',()=>{
  assert.match(handoff,/Standard implementation workflow/);
  assert.match(handoff,/Recommended next task/);
  assert.match(handoff,/latest `main` branch/);
  assert.match(agents,/Before making changes, always read `PROJECT_HANDOFF\.md`/);
});
