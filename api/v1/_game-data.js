import {PRIORITY_SOURCES,PRIORITY_CHAPTERS,PRIORITY_QUESTIONS,PRIORITY_LEVELS} from './_priority-data.js';
export {PRIORITY_QUESTIONS};
// Content edition 2026-09-16. All sign definitions refer to RVV 1990, Bijlage 1.
export const SOURCES = {
 rvv: {title:'RVV 1990 · Bijlage 1',url:'https://wetten.overheid.nl/BWBR0004825/2026-07-01/#Bijlage1',publisher:'Overheid.nl',reviewed:'2026-09-16',effective:'2026-07-01',note:'Primaire bron voor de bordbetekenissen. Afbeeldingen rechtstreeks uit deze bijlage; bronmetadata in official-signs.json.'},
 rules: {title:'RVV 1990 · verkeersregels',url:'https://wetten.overheid.nl/BWBR0004825/2026-07-01/',publisher:'Overheid.nl',reviewed:'2026-09-16',effective:'2026-07-01',note:'Artikelen 54, 62, 63, 64, 67 en 79. Bronversie gedownload en gecontroleerd.'},
 government:{title:'Verkeersborden en verkeersregels',url:'https://www.rijksoverheid.nl/vraag-en-antwoord/verkeersveiligheid/welke-verkeersborden-en-verkeersregels-gelden-in-nederland',publisher:'Rijksoverheid',reviewed:'2026-09-16',note:'Verwijst naar het RVV als wettelijk overzicht.'}
};
export const SIGNS = [
 ['A1','Maximumsnelheid','Snelheid','Het getal is de maximumsnelheid. Je past je snelheid verder aan de omstandigheden aan.'],
 ['A2','Einde maximumsnelheid','Snelheid','De door het bord aangegeven maximumsnelheid eindigt. De overige geldende snelheidsregels blijven van toepassing.'],
 ['A4','Adviessnelheid','Snelheid','Dit bord geeft een aanbevolen snelheid aan. Het is geen bord dat een maximumsnelheid oplegt.'],
 ['B1','Voorrangsweg','Voorrang','Je rijdt op een voorrangsweg. Dit geeft geen vrijstelling van opletten of andere verkeersregels.'],
 ['B2','Einde voorrangsweg','Voorrang','De voorrangsweg eindigt. Kijk naar de regeling van het volgende kruispunt.'],
 ['B6','Verleen voorrang','Voorrang','Verleen voorrang aan bestuurders op de kruisende weg. Het bord verplicht je niet om altijd stil te staan.'],
 ['B7','Stop en verleen voorrang','Voorrang','Stop volledig en verleen voorrang aan bestuurders op de kruisende weg. Staat er een stopstreep, stop dan vóór die streep.'],
 ['C1','Gesloten in beide richtingen','Verbod','Deze weg is in beide richtingen gesloten voor voertuigen, ruiters en geleiders van rij- of trekdieren of vee.'],
 ['C2','Eenrichtingsweg: hier niet inrijden','Verbod','Vanaf deze kant is de eenrichtingsweg gesloten voor voertuigen, ruiters en geleiders van rij- of trekdieren of vee.'],
 ['C3','Eenrichtingsweg','Informatie','Dit bord geeft een eenrichtingsweg aan. Let ook op eventuele uitzonderingen op onderborden.'],
 ['C6','Gesloten voor motorvoertuigen op meer dan twee wielen','Verbod','Een gewone personenauto mag deze weg niet inrijden. Een motorfiets op twee wielen valt niet onder dit specifieke verbod.'],
 ['D1','Rotonde: verplichte rijrichting','Gebod','Volg de aangegeven richting rond de rotonde. Dit bord regelt op zichzelf niet de voorrang.'],
 ['D4','Verplicht rechtdoor','Gebod','Volg de rijrichting die de pijl aangeeft. Hier wijst de pijl rechtdoor.'],
 ['E1','Parkeerverbod','Parkeren','Je mag hier niet parkeren. Dit bord alleen verbiedt niet het onmiddellijk in- of uitstappen of onmiddellijk laden en lossen.'],
 ['E2','Verbod stil te staan','Parkeren','Je mag hier niet vrijwillig stilstaan, ook niet om iemand te laten uitstappen. Stoppen omdat het verkeer dat vereist is iets anders.'],
 ['E4','Parkeergelegenheid','Parkeren','Hier is parkeergelegenheid. Aanvullende voorwaarden kunnen op onderborden staan.'],
 ['F5','Tegenliggers laten voorgaan','Voorrang','Je mag als bestuurder niet doorgaan bij nadering van verkeer uit de tegengestelde richting.'],
 ['F6','Tegenliggers moeten jou laten voorgaan','Voorrang','Bestuurders uit de tegengestelde richting moeten verkeer dat van jouw richting nadert voor laten gaan. Blijf opletten.'],
 ['G1','Autosnelweg','Wegtype','Dit bord geeft het begin van een autosnelweg aan. De geldende maximumsnelheid lees je uit de regels en eventuele snelheidsborden.'],
 ['G3','Autoweg','Wegtype','Dit is een autoweg. Verwar dit symbool niet met het autosnelwegbord.'],
 ['G5','Erf','Wegtype','Je rijdt een erf in. Voor een erf gelden bijzondere verkeersregels.'],
 ['G11','Verplicht fietspad','Gebod','Dit bord geeft een verplicht fietspad aan. Het is geen weg voor een gewone personenauto.'],
 ['J16','Werk in uitvoering','Waarschuwing','Je nadert werkzaamheden. Houd rekening met een afwijkende inrichting en met wegwerkers.'],
 ['J20','Slipgevaar','Waarschuwing','Er bestaat gevaar voor slippen. Rijd beheerst en stem je snelheid en afstand af op de situatie.'],
 ['J21','Kinderen','Waarschuwing','Wees alert op kinderen die de weg kunnen oversteken of onverwacht kunnen reageren.'],
 ['J37','Gevaar','Waarschuwing','Het onderbord geeft aan voor welk gevaar wordt gewaarschuwd. Lees bord en onderbord samen.'],
 ['L8','Doodlopende weg','Informatie','Deze weg loopt dood. Het is geen inrijverbod.' ]
].map(([code,name,category,explanation])=>({code,name,category,explanation,sourceIds:['rvv'],image:`./assets/signs/${code}.png`}));
export const signByCode=Object.fromEntries(SIGNS.map(s=>[s.code,s]));
export const WORLDS=[
 {id:'signs',name:'Verkeersborden',subtitle:'Leer de taal van de weg',available:true},
 {id:'priority',name:'Voorrang',available:true,requires:'signs'}, {id:'speed',name:'Snelheid & wegtypes'},
 {id:'hazards',name:'Gevaarherkenning'}, {id:'maneuvers',name:'Bijzondere manoeuvres'},
 {id:'vehicle',name:'Voertuigkennis'}, {id:'conditions',name:'Bijzondere omstandigheden'},
 {id:'exam',name:'Examenwereld'}
];
export const CHAPTERS=[{name:'De eerste signalen',description:'Kijken, herkennen, onthouden.',label:'DE START',color:'blue'},{name:'Jij ziet het verschil',description:'Van herkenning naar begrip.',label:'DE VERDIEPING',color:'mint'},{name:'De weg op',description:'Pas je kennis toe in situaties.',label:'DE PRAKTIJK',color:'violet'},{name:'Word een Bordenheld',description:'Alles komt samen. Jij bent er klaar voor.',label:'DE FINALE',color:'gold'}];
const definitions=[
 ['De eerste borden','recognize','B7 B6 B1 C2 E4',5],
 ['Kijk en koppel','select','B7 B6 C1 C2 E4',5],
 ['Waarschuwingsradar','sort','J16 J20 J21 D1 C6',5],
 ['De bordenflits','timed','B1 B6 B7 C1 C2 E4',6],
 ['Bij de kruising','scenario','stop yield priority endpriority stopline',5],
 ['Verboden of verplicht?','sort','C1 C2 C6 D1 D4 G11',6],
 ['Parkeerpuzzel','select','E1 E2 E4 E1 E2',5],
 ['De juiste richting','recognize','D1 D4 C2 C3 L8',5],
 ['Bordenmix','timed','E1 E2 D1 D4 C3 C6',6],
 ['De Poortwachter','miniboss','B7 B6 C1 C2 E1 E2 D1 D4 J21 L8',10],
 ['Lees de weg','recognize','G1 G3 G5 G11 L8',5],
 ['Snel gezien','select','A1 A2 A4 G1 G3',5],
 ['Kijk vooruit','scenario','children works slippery danger deadend',5],
 ['Borden sorteren','sort','A1 B1 C6 D4 E2 G3 J16 L8',8],
 ['De smalle doorgang','scenario','opponent prioritypass roundabout parking stopping',5],
 ['De geheugenronde','memory','B2 E1 F5 G3 A4 J21',6],
 ['Tijd voor actie','timed','F5 F6 A1 A4 B2 G11 J37 L8',8],
 ['Situatiemeester','scenario','exception light maneuver speedend busystop roundabout',6],
 ['Laatste training','mixed','B7 C6 D1 E2 F5 G3 A4 J37',8],
 ['De Bordenbaas','boss','stopline exception opponent light roundabout maneuver busystop prioritypass speedend parking',10]
];
export const LEVELS=definitions.map(([name,mode,codes,count],i)=>({id:i+1,worldId:'signs',chapter:Math.floor(i/5),name,mode,codes:codes.split(' '),count,pass:mode==='boss'||mode==='miniboss'?.8:.6,seconds:mode==='timed'?15:null,boss:mode==='boss'||mode==='miniboss'}));
export const MODES={recognize:'Bord herkennen',select:'Kies het bord',sort:'Sorteerspel',timed:'Tegen de klok',scenario:'Visuele situatie',miniboss:'Mini-boss',memory:'Geheugenspel',mixed:'Gemengde training',boss:'Boss fight'};
// Schematic situations describe all relevant conditions. No hidden road rules.
export const SCENARIOS={
 stop:['B7','Je komt bij dit bord. Er is geen ander verkeer. Wat doe je?','Volledig stoppen en daarna veilig verder','Langzaam doorrollen','Alleen stoppen als er verkeer komt','Ook op een lege kruising verplicht B7 je volledig te stoppen.','cross'],
 yield:['B6','Een fietser rijdt op de kruisende weg. Wat doe je?','De fietser voorrang verlenen','Doorrijden omdat je in een auto zit','De fietser laten stoppen','Een fietser is een bestuurder. Bij B6 verleen je ook die bestuurder voorrang.','cross'],
 priority:['B1','Wat vertelt dit bord over de weg waarop je rijdt?','Dit is een voorrangsweg','Je moet altijd stoppen','Dit is een doodlopende weg','B1 duidt een voorrangsweg aan. Let daarnaast op verkeerslichten, aanwijzingen en de situatie.','cross'],
 endpriority:['B2','Je passeert dit bord. Wat verandert er?','De voorrangsweg eindigt','Je krijgt voorrang op alle volgende kruisingen','De weg wordt afgesloten','B2 beëindigt de voorrangsweg. Bekijk de voorrangsregeling bij de volgende kruising.','cross'],
 stopline:['B7','Er ligt een stopstreep vóór de kruising. Waar stop je?','Vóór de stopstreep','Op de kruisende weg','Alleen naast het bord, ongeacht de streep','Bij een stopverplichting stop je vóór de stopstreep (RVV artikel 79).','cross'],
 children:['J21','Je nadert dit bord bij een school. Waar ben je extra alert op?','Kinderen die onverwacht de weg op komen','Een verplicht fietspad','Een parkeerverbod','J21 waarschuwt voor kinderen. De situatie bepaalt hoe je veilig reageert.','road'],
 works:['J16','Je nadert dit bord. Wat kun je verwachten?','Werkzaamheden aan de weg','Einde van alle verboden','Een verplichte parkeerplaats','J16 waarschuwt voor werk in uitvoering. Volg ook de tijdelijke verkeersaanwijzingen.','road'],
 slippery:['J20','Het regent en je ziet dit bord. Waarvoor waarschuwt het?','Slipgevaar','Een weg met alleen bochten','Een verplichting om stil te staan','J20 waarschuwt voor slipgevaar. Rustig sturen en remmen helpt je controle te houden.','road'],
 danger:['J37','Onder dit bord staat “Zachte berm”. Wat betekent de combinatie?','Gevaar door een zachte berm','Verplicht in de berm parkeren','Einde gevaarlijke situatie','J37 verwijst voor de aard van het gevaar naar het onderbord. Hier is de berm zacht.','road','Zachte berm'],
 deadend:['L8','Je ziet dit bord aan het begin van een straat. Mag je er met je auto in?','Ja, dit bord geeft alleen aan dat de weg doodloopt','Nee, dit is een geslotenverklaring','Alleen als je er woont','L8 informeert over een doodlopende weg; het is zelf geen verbod om in te rijden.','road'],
 opponent:['F5','Bij de versmalling nadert een tegenligger. Wat doe je?','Wachten en de tegenligger laten voorgaan','Als eerste de versmalling inrijden','De tegenligger met lichtsignalen laten stoppen','F5 verbiedt je door te gaan bij naderend verkeer uit de tegengestelde richting.','narrow'],
 prioritypass:['F6','Wie moet bij deze versmalling voor laten gaan?','Bestuurders uit de tegengestelde richting','Altijd jij','Degene met het kleinste voertuig','F6 zegt dat bestuurders uit de andere richting jouw richting voor moeten laten gaan. Rijd pas als dat veilig kan.','narrow'],
 roundabout:['D1','Regelt dit bord op zichzelf wie voorrang heeft?','Nee, het geeft de verplichte rijrichting aan','Ja, al het verkeer op de rotonde heeft hierdoor voorrang','Ja, iedereen die oprijdt heeft hierdoor voorrang','D1 regelt de rijrichting. Voor de voorrang kijk je naar de overige verkeerstekens en regels.','road'],
 parking:['E1','Er gelden geen andere verboden. Mag je direct iemand laten uitstappen?','Ja, onmiddellijk uitstappen is geen parkeren','Nee, je mag nooit stilstaan','Alleen met alarmlichten aan','Bij E1 is parkeren verboden. Het onmiddellijk laten in- of uitstappen valt niet onder parkeren (RVV artikel 1).','road'],
 stopping:['E2','Je wilt even vrijwillig stoppen om iemand te laten uitstappen. Mag dat hier?','Nee, hier geldt een verbod stil te staan','Ja, als je minder dan een minuut stilstaat','Ja, met draaiende motor','E2 verbiedt vrijwillig stilstaan, ook voor het onmiddellijk laten uitstappen.','road'],
 exception:['C2','Onder dit bord staat “Uitgezonderd fietsers”. Jij rijdt in een personenauto. Mag je hier inrijden?','Nee, de uitzondering geldt voor fietsers','Ja, de uitzondering geldt voor iedereen','Ja, als je langzaam rijdt','Een onderbord met een uitzondering voor fietsers maakt geen uitzondering voor je auto (RVV artikel 67).','road','Uitgezonderd fietsers'],
 light:['B6','Een werkend verkeerslicht geeft jou groen. Gaat het licht boven dit voorrangsbord?','Ja, verkeerslichten gaan boven voorrangsborden','Nee, het bord gaat altijd voor','Alleen als het licht knippert','Verkeerslichten gaan boven verkeersborden die de voorrang regelen (RVV artikel 64). Groen is geen vrijstelling van opletten.','cross','Verkeerslicht: groen'],
 maneuver:['B1','Je rijdt vanuit een parkeervak de rijbaan van deze voorrangsweg op. Wat doe je?','Al het overige verkeer voor laten gaan','Zelf voorrang nemen door B1','Alleen verkeer van rechts voor laten gaan','Wegrijden is een bijzondere manoeuvre. Je laat daarbij het overige verkeer voorgaan (RVV artikel 54).','road'],
 speedend:['A2','Mag je na dit bord onbeperkt hard rijden?','Nee, andere geldende maximumsnelheden blijven gelden','Ja, alle snelheidsregels vervallen','Ja, buiten de bebouwde kom altijd','A2 beëindigt de aangeduide maximumsnelheid. Het heft niet alle andere verkeersregels op.','road'],
 busystop:['B7','Je bent gestopt. Op de kruisende weg nadert een auto. Wat doe je nu?','Wachten en die auto voorrang verlenen','Direct rijden, want je hebt al gestopt','Alleen voorrang geven aan fietsers','B7 heeft twee onderdelen: stoppen én voorrang verlenen. Stoppen alleen is dus niet genoeg.','cross']
};
Object.assign(SOURCES,PRIORITY_SOURCES);
LEVELS.push(...PRIORITY_LEVELS);
export const WORLD_CONFIG={
 signs:{number:1,name:'Verkeersborden',badge:'Bordenheld',finalLevel:20,firstLevel:1,chapters:CHAPTERS,headline:'Elke held begint<br>met goed kijken.',intro:'Leer de taal van de weg. Ga met Mursal op pad en word een echte Bordenheld.'},
 priority:{number:2,name:'Voorrang',badge:'Voorrangsheld',finalLevel:40,firstLevel:21,chapters:PRIORITY_CHAPTERS,headline:'Jij ziet wie<br>er eerst gaat.',intro:'Een kruispunt, een keuze. Kijk met Mursal naar de ander en word een Voorrangsheld.'}
};
MODES.priority='Kruispuntsituatie';MODES.order='Volgorde kiezen';MODES.rule='Welke regel geldt?';
function shuffle(items,rng){return items.map(v=>({v,k:rng()})).sort((a,b)=>a.k-b.k).map(x=>x.v);}
export function buildQuestions(level,rng=Math.random){
 return level.codes.map((code,i)=>{
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
