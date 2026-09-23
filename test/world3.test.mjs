import test from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../api/v1/_game-data.js';
globalThis.MURSAL_CONTENT=data;
const engine=await import('../game/engine.js');
function win(id,s){const r=engine.createRun(id,s);for(let i=0;i<r.questions.length;i++){engine.answerRun(r,s,r.questions[r.index].answer);if(i<r.questions.length-1)engine.nextQuestion(r,s);}return engine.finishRun(r,s);}
test('World 3 contains 20 levels and 34 sourced situations; all choices are valid',()=>{
 assert.equal(data.LEVELS.length,60);assert.equal(Object.keys(data.SPEED_QUESTIONS).length,34);
 for(const l of data.LEVELS.filter(l=>l.worldId==='speed'))for(const rng of [()=>0,()=>.99]){
  const qs=data.buildQuestions(l,rng);assert.equal(qs.length,l.count);
  for(const q of qs){assert.equal(q.kind,'speed');assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);q.sourceIds.forEach(id=>assert.ok(data.SOURCES[id]));if(q.scene.sign)assert.ok(data.signByCode[q.scene.sign]);}
 }
});
test('critical speed distinctions and both judge outcomes remain correct',()=>{
 const q=data.SPEED_QUESTIONS;
 for(const [id,answer] of Object.entries({day:'100 km/u',night:'130 km/u',allDay:'100 km/u',dayException:'130 km/u',matrixHigher:'80 km/u',trailer90:'90 km/u',trailerHeavy:'80 km/u',erf:'15 km/u'}))assert.equal(q[id].answer,answer);
 const judge=data.LEVELS.find(l=>l.worldId==='speed'&&l.mode==='judge');assert.ok(data.buildQuestions(judge,()=>0).every(q=>q.answer==='Klopt'));assert.ok(data.buildQuestions(judge,()=>.99).every(q=>q.answer==='Klopt niet'));
});
test('old 40-level save retains scores and gains third world and badge sequentially',()=>{
 const s=engine.freshSave();assert.throws(()=>engine.createRun(41,s));for(let i=1;i<=39;i++)win(i,s);assert.equal(engine.isUnlocked(s,41),false);win(40,s);
 s.worldId='priority';const oldXP=s.xp;const migrated=engine.normalizeSave(JSON.parse(JSON.stringify(s)));assert.equal(migrated.xp,oldXP);assert.equal(migrated.badges.priority,true);assert.equal(migrated.badges.speed,undefined);
 for(let i=41;i<=60;i++){const result=win(i,migrated);assert.equal(result.stars,3);assert.equal(!!migrated.badges.speed,i===60);}
 assert.equal(Object.values(migrated.levels).reduce((n,l)=>n+l.stars,0),180);assert.equal(win(60,migrated).gain,0);
 migrated.worldId='speed';migrated.active=engine.createRun(60,migrated);engine.answerRun(migrated.active,migrated,migrated.active.questions[0].answer);const restored=engine.normalizeSave(JSON.parse(JSON.stringify(migrated)));assert.equal(restored.worldId,'speed');assert.equal(restored.active.correct,1);
 migrated.energy=0;engine.startComeback(migrated);assert.ok(migrated.comeback.questions.every(q=>q.kind==='speed'));for(let i=0;i<5;i++){engine.answerComeback(migrated,migrated.comeback.questions[i].answer);engine.nextComeback(migrated);}assert.equal(migrated.energy,5);assert.equal(migrated.comeback,null);
});
