import test from 'node:test';
import assert from 'node:assert/strict';
import {FIVE_DIFFICULTIES,FIVE_RISKS,fiveChallengeConfig,resolveFiveChallenge} from '../src/games/five.js';

test('Five Second Challenge keeps the three base difficulty times',()=>{
  assert.equal(FIVE_DIFFICULTIES.easy.seconds,7);
  assert.equal(FIVE_DIFFICULTIES.normal.seconds,5);
  assert.equal(FIVE_DIFFICULTIES.hard.seconds,4);
});

test('SAFE keeps the base time and awards one point',()=>{
  const config=fiveChallengeConfig('normal','safe');
  assert.equal(config.seconds,5);
  assert.equal(config.points,1);
  assert.equal(resolveFiveChallenge(true,'safe'),1);
});

test('RUSH removes one second and doubles a successful reward',()=>{
  assert.equal(fiveChallengeConfig('easy','rush').seconds,6);
  assert.equal(fiveChallengeConfig('normal','rush').seconds,4);
  assert.equal(fiveChallengeConfig('hard','rush').seconds,3);
  assert.equal(resolveFiveChallenge(true,'rush'),2);
});

test('failed challenges never award points',()=>{
  assert.equal(resolveFiveChallenge(false,'safe'),0);
  assert.equal(resolveFiveChallenge(false,'rush'),0);
});

test('unknown challenge settings fail fast',()=>{
  assert.throws(()=>fiveChallengeConfig('nightmare','safe'),/unknown five-second difficulty/);
  assert.throws(()=>fiveChallengeConfig('normal','reckless'),/unknown five-second risk/);
  assert.throws(()=>resolveFiveChallenge(true,'reckless'),/unknown five-second risk/);
});

test('risk definitions remain immutable public contracts',()=>{
  assert.ok(Object.isFrozen(FIVE_RISKS));
  assert.ok(Object.isFrozen(FIVE_RISKS.safe));
  assert.ok(Object.isFrozen(FIVE_RISKS.rush));
});
