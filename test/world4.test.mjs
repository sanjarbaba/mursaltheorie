import test from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../api/v1/_game-data.js';
globalThis.MURSAL_CONTENT=data;
const engine=await import('../game/engine.js');
function win(id,save){const run=engine.createRun(id,save);for(let i=0;i<run.questions.length;i++){engine.answerRun(run,save,run.questions[run.index].answer);if(i<run.questions.length-1)engine.nextQuestion(run,save);}return engine.finishRun(run,save);}
test('Wereld 4 has 20 sourced levels, distinct choices and appropriate reactions',()=>{
 assert.equal(data.LEVELS.length,80);
 assert.equal(Object.keys(data.HAZARD_QUESTIONS).length,34);
 const levels=data.LEVELS.filter(l=>l.worldId==='hazards');
 assert.deepEqual(levels.map(l=>l.id),Array.from({length:20},(_,i)=>i+61));
 assert.deepEqual(levels.filter(l=>l.boss).map(l=>l.id),[70,80]);
 for(const l of levels)for(const q of data.buildQuestions(l,()=>.4)){
  assert.equal(q.kind,'hazard');assert.ok(q.context);assert.ok(q.explanation);assert.ok(q.scene?.road);
  assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);
  q.sourceIds.forEach(id=>assert.ok(data.SOURCES[id]?.url.startsWith('https://wetten.overheid.nl/')));
 }
 const q=data.HAZARD_QUESTIONS;
 assert.equal(q.ball.action,'Remmen');assert.equal(q.school.action,'Gas loslaten');assert.equal(q.openroad.action,'Doorrijden en blijven kijken');
});
test('60-level progress migrates, World 4 unlocks and awards its badge after level 80',()=>{
 const old=engine.freshSave();for(let i=1;i<=60;i++)win(i,old);
 assert.ok(old.badges.speed);assert.equal(engine.isUnlocked(old,61),true);
 const save=engine.normalizeSave(JSON.parse(JSON.stringify(old)));
 assert.equal(save.xp,old.xp);assert.equal(save.badges.hazards,undefined);
 save.worldId='hazards';
 assert.equal(engine.normalizeSave(JSON.parse(JSON.stringify(save))).worldId,'hazards');
 for(let i=61;i<=80;i++){assert.ok(engine.isUnlocked(save,i));const result=win(i,save);assert.ok(result.passed);assert.equal(!!save.badges.hazards,i===80);}
 assert.equal(Object.values(save.levels).reduce((n,l)=>n+l.stars,0),240);
 assert.equal(win(80,save).gain,0);
 save.energy=0;const comeback=engine.startComeback(save);assert.ok(comeback.questions.every(q=>q.kind==='hazard'));
 for(let i=0;i<5;i++){engine.answerComeback(save,save.comeback.questions[i].answer);engine.nextComeback(save);}
 assert.equal(save.energy,5);assert.equal(save.comeback,null);
});
test('World 4 bosses disable powers and five mistakes end a normal run',()=>{
 const save=engine.freshSave();for(let i=1;i<=69;i++)win(i,save);
 const boss=engine.createRun(70,save);assert.equal(engine.usePower(boss,'shield'),false);win(70,save);
 const run=engine.createRun(71,save);for(let i=0;i<5;i++){const q=run.questions[run.index];engine.answerRun(run,save,q.options.find(o=>o!==q.answer));if(i<4)engine.nextQuestion(run,save);}
 assert.equal(save.energy,0);assert.equal(engine.finishRun(run,save).passed,false);
});
