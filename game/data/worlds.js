export const {SOURCES,SIGNS,signByCode,WORLDS,CHAPTERS,LEVELS,MODES,SCENARIOS,PRIORITY_QUESTIONS,SPEED_QUESTIONS,WORLD_CONFIG}=globalThis.MURSAL_CONTENT;
function shuffle(items,rng){return items.map(v=>({v,k:rng()})).sort((a,b)=>a.k-b.k).map(x=>x.v);}
export function buildQuestions(level,rng=Math.random){
 return level.codes.map((code,i)=>{
  if(level.worldId==='speed'){
   const item=SPEED_QUESTIONS[code];const judge=(level.mode==='judge'||level.mode==='mixed'&&i%2===0)&&item.numeric;
   const proposed=judge?[item.answer,...item.wrong][Math.floor(rng()*(item.wrong.length+1))]:null;
   return {...item,id:`${level.id}-${i}`,kind:'speed',mode:judge?'judge':'speed',prompt:item.context+(judge?` Mursal zegt: maximaal ${proposed}. Klopt dat?`:''),answer:judge?(proposed===item.answer?'Klopt':'Klopt niet'):item.answer,options:shuffle(judge?['Klopt','Klopt niet']:[item.answer,...item.wrong],rng)};
  }
  if(level.worldId==='priority'){
   const item=PRIORITY_QUESTIONS[code];let mode=level.mode==='mixed'?['priority','rule','order'][i%3]:level.mode;
   if(!['priority','rule','order'].includes(mode))mode='priority';
   if(mode==='order'&&!/gaat eerst$/.test(item.answer))mode='priority';
   let prompt=item.context+(item.context.endsWith('?')?'':' Wat doe je?'),answer=item.answer,options=[answer,...item.wrong];
   if(mode==='order'){prompt+=' Kies de juiste volgorde.';answer=item.answer.startsWith('Jij')?'Jij → De ander':'De ander → Jij';options=['Jij → De ander','De ander → Jij'];}
   if(mode==='rule'){prompt+=' Welke uitleg past hierbij?';answer=item.explanation;const alternatives=[
    ['p15','Op een gelijkwaardig kruispunt gaat een bestuurder van rechts voor.'],
    ['p18','Bij afslaan laat je rechtdoorgaand verkeer op dezelfde weg voorgaan.'],
    ['p49','Een voetganger die de zebra wil gebruiken, laat je voorgaan.'],
    ['p54','Bij wegrijden laat je al het overige verkeer voorgaan.']
   ].filter(([id])=>id!==item.sourceIds[0]);options=[answer,...shuffle(alternatives,rng).slice(0,2).map(x=>x[1])];}
   return {...item,id:`${level.id}-${i}`,kind:'priority',mode,prompt,answer,options:shuffle(options,rng)};
  }
  if(SCENARIOS[code]){const [sign,prompt,right,b,c,explanation,scene,under]=SCENARIOS[code];return {id:`${level.id}-${i}`,kind:'scenario',sign,prompt,options:shuffle([right,b,c],rng),answer:right,explanation,scene,under,sourceIds:['rvv','rules']};}
  const s=signByCode[code];let kind=level.mode;
  if(['timed','miniboss','recognize'].includes(kind))kind='recognize';
  if(kind==='mixed')kind=['recognize','select','sort'][i%3];
  if(kind==='memory')kind='memory';
  let prompt=`Wat betekent dit bord?`,answer=s.name,options;
  if(kind==='select'){prompt=`Welk bord betekent: “${s.name}”?`;answer=code;options=[code,...shuffle(SIGNS.filter(t=>t.code!==code),rng).slice(0,3).map(t=>t.code)];}
  else if(kind==='sort'){prompt='In welke groep hoort dit bord?';answer=s.category;options=[answer,...shuffle([...new Set(SIGNS.map(t=>t.category))].filter(c=>c!==answer),rng).slice(0,3)];}
  else {options=[s.name,...shuffle(SIGNS.filter(t=>t.code!==code),rng).slice(0,3).map(t=>t.name)];}
  return {id:`${level.id}-${i}`,kind,sign:code,prompt,answer,options:shuffle(options,rng),explanation:s.explanation,sourceIds:s.sourceIds};
 });
}
