export const {SOURCES,SIGNS,signByCode,WORLDS,CHAPTERS,LEVELS,MODES,SCENARIOS}=globalThis.MURSAL_CONTENT;
function shuffle(items,rng){return items.map(v=>({v,k:rng()})).sort((a,b)=>a.k-b.k).map(x=>x.v);}
export function buildQuestions(level,rng=Math.random){
 return level.codes.map((code,i)=>{
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
