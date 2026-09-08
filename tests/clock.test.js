import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOCK_RULES,
  nextClockRound,
  resolveClockRound
} from '../src/games/clock.js';

const rule=id=>CLOCK_RULES.find(item=>item.id===id);

test('Body Clock JUST picks the smallest absolute error',()=>{
  const result=resolveClockRound([6.7,7.18,7.4],7,rule('just'));
  assert.deepEqual(result.winners,[1]);
  assert.deepEqual(result.precision,[]);
  assert.equal(result.fallback,false);
});

test('Body Clock NO OVER prefers eligible times even when an overshoot is closer',()=>{
  const result=resolveClockRound([6.8,7.01,6.6],7,rule('no-over'));
  assert.deepEqual(result.eligible,[true,false,true]);
  assert.deepEqual(result.winners,[0]);
});

test('Body Clock NO EARLY prefers target-or-later times',()=>{
  const result=resolveClockRound([6.99,7.2,7.5],7,rule('no-early'));
  assert.deepEqual(result.eligible,[false,true,true]);
  assert.deepEqual(result.winners,[1]);
});

test('Body Clock falls back to absolute error when nobody satisfies the side rule',()=>{
  const result=resolveClockRound([7.2,7.05,7.4],7,rule('no-over'));
  assert.equal(result.fallback,true);
  assert.deepEqual(result.winners,[1]);
});

test('Body Clock marks winning attempts within 0.10 seconds for the precision bonus',()=>{
  const result=resolveClockRound([6.91,7.2],7,rule('just'));
  assert.deepEqual(result.winners,[0]);
  assert.deepEqual(result.precision,[0]);
});

test('Body Clock does not repeat the previous rule or target',()=>{
  for(const previous of CLOCK_RULES){
    const round=nextClockRound(previous.id,5,()=>0);
    assert.notEqual(round.rule.id,previous.id);
    assert.notEqual(round.target,5);
  }
});
