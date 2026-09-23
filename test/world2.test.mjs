import test from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../api/v1/_game-data.js';
globalThis.MURSAL_CONTENT=data;
const {freshSave,normalizeSave,createRun,answerRun,nextQuestion,finishRun,isUnlocked,startComeback}=await import('../game/engine.js');
function win(id,s){const r=createRun(id,s);for(let i=0;i<r.questions.length;i++){answerRun(r,s,r.questions[r.index].answer);if(i<r.questions.length-1)nextQuestion(r,s);}return finishRun(r,s);}
test('40 sourced levels: World 2 has 32 cases, correct modes, unique choices',()=>{
 assert.equal(data.LEVELS.length,60);assert.equal(Object.keys(data.PRIORITY_QUESTIONS).length,32);
 for(const l of data.LEVELS.filter(l=>l.worldId==='priority')){const qs=data.buildQuestions(l);assert.equal(qs.length,l.count);for(const q of qs){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.kind,'priority');for(const id of q.sourceIds)assert.ok(data.SOURCES[id]);}}
 assert.equal(data.LEVELS[29].boss,true);assert.equal(data.LEVELS[39].boss,true);
});
test('old World 1 save migrates, retains XP and unlocks World 2 only after first boss',()=>{
 const s=freshSave();assert.throws(()=>createRun(21,s));for(let i=1;i<=19;i++)win(i,s);
 assert.equal(isUnlocked(s,21),false);win(20,s);const before=s.xp;
 delete s.badges;delete s.worldId;
 const restored=normalizeSave(JSON.parse(JSON.stringify(s)));
 assert.equal(restored.xp,before);assert.equal(restored.badges.signs,true);assert.equal(restored.badges.priority,undefined);assert.equal(restored.worldId,'signs');assert.equal(isUnlocked(restored,21),true);
 for(let i=21;i<=40;i++)win(i,restored);
 assert.equal(restored.badges.priority,true);assert.equal(Object.values(restored.levels).reduce((a,b)=>a+b.stars,0),120);
 assert.equal(win(40,restored).gain,0);
 restored.worldId='priority';restored.active=createRun(40,restored);answerRun(restored.active,restored,restored.active.questions[0].answer);
 const reload=normalizeSave(JSON.parse(JSON.stringify(restored)));assert.equal(reload.worldId,'priority');assert.equal(reload.active.levelId,40);assert.equal(reload.active.correct,1);
});
test('priority comeback and world locking cannot be bypassed by selected world metadata',()=>{
 const s=freshSave();s.worldId='priority';assert.equal(normalizeSave(s).worldId,'signs');
 for(let i=1;i<=20;i++)win(i,s);s.worldId='priority';s.energy=0;startComeback(s);
 assert.equal(s.comeback.questions.length,5);assert.ok(s.comeback.questions.every(q=>q.kind==='priority'));
 assert.equal(normalizeSave(JSON.parse(JSON.stringify(s))).comeback.questions.length,5);
});

