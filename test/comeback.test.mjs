import * as content from '../api/v1/_game-data.js';
globalThis.MURSAL_CONTENT=content;
import test from 'node:test';
import assert from 'node:assert/strict';
const {freshSave,normalizeSave,createRun,answerRun,nextQuestion,finishRun,startComeback,answerComeback,nextComeback,regenerate}=await import('../game/engine.js');
test('five lost lives ends a round and a five-question comeback restores all lives once',()=>{
 let s=freshSave();const r=createRun(1,s);
 for(let i=0;i<5;i++){answerRun(r,s,null);if(i<4)nextQuestion(r,s);}
 assert.equal(s.energy,0);assert.equal(finishRun(r,s).passed,false);
 regenerate(s,Date.now()+86400000);assert.equal(s.energy,0);
 startComeback(s);let q=s.comeback.questions[0];answerComeback(s,q.options.find(o=>o!==q.answer));nextComeback(s);assert.equal(s.comeback.index,0);
 for(let i=0;i<5;i++){
  q=s.comeback.questions[s.comeback.index];answerComeback(s,q.answer);
  assert.equal(answerComeback(s,q.answer),false);
  s=normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(nextComeback(s),i===4);
  assert.equal(s.energy,i===4?5:0);
 }
 assert.equal(s.comeback,null);assert.equal(nextComeback(s),false);assert.equal(s.xp,0);assert.deepEqual(s.levels,{});
});
