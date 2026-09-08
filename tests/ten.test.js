import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTenWinners,tenPublicSignal,tenTurnOrder} from '../src/games/ten.js';

test('ギリギリ10 public signals hide exact totals behind broad bands',()=>{
  assert.equal(tenPublicSignal(1),'safe');
  assert.equal(tenPublicSignal(6),'safe');
  assert.equal(tenPublicSignal(7),'hot');
  assert.equal(tenPublicSignal(9),'hot');
  assert.equal(tenPublicSignal(10),'perfect');
  assert.equal(tenPublicSignal(11),'bust');
  assert.equal(tenPublicSignal(9,true),'bust');
});

test('ギリギリ10 rotates the starting player without changing seat identity',()=>{
  assert.deepEqual(tenTurnOrder(4,0),[0,1,2,3]);
  assert.deepEqual(tenTurnOrder(4,2),[2,3,0,1]);
  assert.deepEqual(tenTurnOrder(4,4),[0,1,2,3]);
  assert.deepEqual(tenTurnOrder(4,-1),[3,0,1,2]);
});

test('ギリギリ10 highest safe total wins',()=>{
  assert.deepEqual(resolveTenWinners([8,10,12],[false,false,true]),[1]);
});

test('ギリギリ10 keeps tied safe winners',()=>{
  assert.deepEqual(resolveTenWinners([9,9,8],[false,false,false]),[0,1]);
});

test('ギリギリ10 uses the smallest bust when everyone goes over',()=>{
  assert.deepEqual(resolveTenWinners([13,11,12],[true,true,true]),[1]);
});
