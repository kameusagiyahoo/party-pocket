import test from 'node:test';
import assert from 'node:assert/strict';
import {SYNC_MODES,nextSyncMode,nextSyncPrompt,nextSyncTarget,resolveSyncRound} from '../src/games/sync.js';

const answer=key=>({key,label:key});

test('Sync CROWD keeps cluster-size scoring',()=>{
  const result=resolveSyncRound([answer('a'),answer('a'),answer('a'),answer('b')],{mode:'crowd'});
  assert.deepEqual(result.scores,[2,2,2,0]);
});

test('Sync READ rewards predictors and caps the target bonus at two',()=>{
  const result=resolveSyncRound([answer('a'),answer('b'),answer('b'),answer('b')],{mode:'read',targetIndex:1});
  assert.deepEqual(result.scores,[0,2,1,1]);
  assert.deepEqual(result.matchedPredictors,[2,3]);
  assert.equal(result.targetKey,'b');
});

test('Sync READ works as a mutual read for two players',()=>{
  const result=resolveSyncRound([answer('x'),answer('x')],{mode:'read',targetIndex:0});
  assert.deepEqual(result.scores,[1,1]);
});

test('Sync modes alternate instead of repeating',()=>{
  for(const mode of SYNC_MODES){
    assert.notEqual(nextSyncMode(mode.id,()=>0).id,mode.id);
  }
});

test('Sync prompt does not repeat immediately',()=>{
  const first=nextSyncPrompt(null,()=>0);
  const next=nextSyncPrompt(first.id,()=>0);
  assert.notEqual(next.id,first.id);
});

test('Sync READ target rotates when possible',()=>{
  assert.notEqual(nextSyncTarget(4,0,()=>0),0);
  assert.equal(nextSyncTarget(2,0,()=>0),1);
});
