import {LEVELS,buildQuestions} from './data/worlds.js';
export const SAVE_KEY='mursal-theory-hero.v1'+(globalThis.MURSAL_ACCOUNT?'.'+globalThis.MURSAL_ACCOUNT:'');
export const REGEN_MS=10*60*1000;
export function freshSave(now=Date.now()){return {version:1,xp:0,energy:5,energyAt:now,levels:{},badge:false,active:null,settings:{untimed:false},comeback:null};}
export function normalizeSave(raw,now=Date.now()){
 const base=freshSave(now);if(!raw||raw.version!==1)return base;
 base.energy=Number.isFinite(raw.energy)?Math.max(0,Math.min(5,Math.floor(raw.energy))):5;
 base.energyAt=Number.isFinite(raw.energyAt)?Math.min(now,Math.max(0,raw.energyAt)):now;
 for(const l of LEVELS){const r=raw.levels?.[l.id];if(r&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=3&&Number.isFinite(r.xp)&&r.xp>=0)base.levels[l.id]={stars:r.stars,xp:Math.min(1000,r.xp),best:Math.max(0,Math.min(100,Number(r.best)||0))};}
 // Progress must remain contiguous; corrupted or future records cannot unlock levels.
 let gap=false;for(const l of LEVELS){if(!base.levels[l.id])gap=true;if(gap)delete base.levels[l.id];}
 base.xp=Object.values(base.levels).reduce((a,b)=>a+b.xp,0);base.badge=!!base.levels[20];
 base.settings.untimed=raw.settings?.untimed===true;
 const a=raw.active;
 if(a&&LEVELS.some(l=>l.id===a.levelId)&&Array.isArray(a.questions)&&a.questions.length===LEVELS[a.levelId-1].count&&Number.isInteger(a.index)&&a.index>=0&&a.index<a.questions.length&&a.questions.every(q=>typeof q.prompt==='string'&&Array.isArray(q.options)&&q.options.includes(q.answer))&&Number.isInteger(a.correct)&&a.correct>=0&&a.correct<=a.questions.length&&Number.isFinite(a.earned)&&a.earned>=0&&Array.isArray(a.mistakes)&&Array.isArray(a.used)&&isUnlocked(base,a.levelId))base.active=a;
 if(raw.comeback&&Array.isArray(raw.comeback.questions)&&raw.comeback.questions.length===5&&raw.comeback.questions.every(q=>q.options?.includes(q.answer))&&Number.isInteger(raw.comeback.index)&&raw.comeback.index>=0&&raw.comeback.index<5)base.comeback=raw.comeback;return base;
}
export function regenerate(save){return save;}
export function isUnlocked(save,id){return id===1||!!save.levels[id-1];}
export function createRun(levelId,save,{practice=false,rng=Math.random}={}){
 const level=LEVELS.find(l=>l.id===levelId);if(!level||(!practice&&!isUnlocked(save,levelId)))throw Error('Dit level is nog vergrendeld.');
 if(!practice&&save.energy<=0)throw Error('Oefen om energie terug te verdienen.');
 return {levelId,practice,questions:buildQuestions(level,rng),index:0,correct:0,earned:0,mistakes:[],feedback:null,used:[],shield:false,boost:0,hint:false,seconds:level.seconds&&!save.settings.untimed&&!practice?level.seconds:null,paused:false,memoryShown:true};
}
export function answerRun(run,save,answer,now=Date.now()){
 if(run.feedback||run.paused)return null;
 const q=run.questions[run.index];if(answer!==null&&!q.options.includes(answer))throw Error('Ongeldig antwoord');
 const correct=answer===q.answer;let protectedError=false;
 if(correct){run.correct++;run.earned+=20*(run.boost>0?2:1);if(run.boost>0)run.boost--;}
 else{run.mistakes.push(run.index);if(!run.practice){if(run.shield){run.shield=false;protectedError=true;}else{if(save.energy===5)save.energyAt=now;save.energy=Math.max(0,save.energy-1);}}}
 run.feedback={correct,selected:answer,protectedError};return run.feedback;
}
export function usePower(run,power){
 if(LEVELS[run.levelId-1].boss||run.feedback||run.paused||run.used.includes(power)||!['vision','shield','boost'].includes(power))return false;
 run.used.push(power);if(power==='vision')run.hint=true;if(power==='shield')run.shield=true;if(power==='boost')run.boost=3;return true;
}
export function nextQuestion(run,save){
 if(!run.feedback)return false;if(!run.practice&&save.energy===0)return false;
 run.index++;run.feedback=null;run.hint=false;run.memoryShown=true;
 run.seconds=LEVELS[run.levelId-1].seconds&&!save.settings.untimed&&!run.practice?LEVELS[run.levelId-1].seconds:null;return true;
}
export function finishRun(run,save){
 const level=LEVELS[run.levelId-1],ratio=run.correct/run.questions.length;
 const passed=ratio>=level.pass&&(run.practice||save.energy>0),stars=passed?(ratio===1?3:ratio>=.8?2:1):0;
 let gain=0;if(passed&&!run.practice){const previous=save.levels[level.id]||{stars:0,xp:0,best:0};const xp=run.earned+20;gain=Math.max(0,xp-previous.xp);save.levels[level.id]={stars:Math.max(stars,previous.stars),xp:previous.xp+gain,best:Math.max(previous.best,Math.round(ratio*100))};save.xp+=gain;save.badge=!!save.levels[20];}
 save.active=null;return {passed,stars,gain,correct:run.correct,total:run.questions.length,practice:run.practice,mistakes:run.mistakes.map(i=>run.questions[i]),levelId:level.id};
}

export function startComeback(save){
 if(save.energy>0)return null;
 if(!save.comeback){const codes=['B7','B6','C2','E1','J21'].sort(()=>Math.random()-.5);save.comeback={questions:buildQuestions({...LEVELS[0],codes}),index:0,feedback:null};}
 return save.comeback;
}
export function answerComeback(save,answer){
 const c=save.comeback;if(!c||c.feedback)return false;
 const q=c.questions[c.index];if(!q.options.includes(answer))return false;
 c.feedback={correct:answer===q.answer};return true;
}
export function nextComeback(save){
 const c=save.comeback;if(!c?.feedback)return false;
 if(c.feedback.correct)c.index++;
 c.feedback=null;
 if(c.index===5){save.energy=5;save.comeback=null;save.active=null;return true;}
 return false;
}
