import test from 'node:test';
import assert from 'node:assert/strict';
import {MINORITY_MIN_PLAYERS,MINORITY_PROMPTS,nextMinorityPrompt,resolveMinorityRound} from '../src/games/minority.js';

test('Minority requires at least three players',()=>{
  assert.equal(MINORITY_MIN_PLAYERS,3);
  assert.throws(()=>resolveMinorityRound([0,1],0),RangeError);
});

test('lone minority earns three points without bonus',()=>{
  const result=resolveMinorityRound([0,0,1],0);
  assert.deepEqual(result.counts,[2,1]);
  assert.equal(result.minority,1);
  assert.equal(result.baseGain,3);
  assert.equal(result.bonusApplied,false);
  assert.deepEqual(result.gains,[0,0,3]);
});

test('lone minority earns four points on bonus side',()=>{
  const result=resolveMinorityRound([0,0,1],1);
  assert.equal(result.minority,1);
  assert.equal(result.bonusApplied,true);
  assert.deepEqual(result.gains,[0,0,4]);
});

test('multi-player minority gains two plus bonus when applicable',()=>{
  const result=resolveMinorityRound([0,0,0,1,1],1);
  assert.deepEqual(result.counts,[3,2]);
  assert.equal(result.baseGain,2);
  assert.deepEqual(result.gains,[0,0,0,3,3]);
});

test('ties and unanimous votes award no points',()=>{
  assert.deepEqual(resolveMinorityRound([0,0,1,1],0).gains,[0,0,0,0]);
  assert.deepEqual(resolveMinorityRound([1,1,1],1).gains,[0,0,0]);
});

test('invalid vote values fail fast',()=>{
  assert.throws(()=>resolveMinorityRound([0,1,2],0),RangeError);
  assert.throws(()=>resolveMinorityRound([0,0,1],2),RangeError);
});

test('next prompt does not repeat the immediately previous prompt',()=>{
  const previous=MINORITY_PROMPTS[0];
  const next=nextMinorityPrompt(previous.id,()=>0);
  assert.notEqual(next.id,previous.id);
  assert.equal(next.id,MINORITY_PROMPTS[1].id);
});
