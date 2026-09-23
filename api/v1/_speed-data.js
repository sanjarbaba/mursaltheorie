// Teaching edition 2026-09-23, checked against RVV 1990 (2026-07-01) and RWS.
// Unless explicitly specified otherwise: a passenger car, without a trailer.
const base='https://wetten.overheid.nl/BWBR0004825/2026-07-01/';
export const SPEED_SOURCES=Object.fromEntries([
 ['s19','Snelheid aanpassen aan zicht','HoofdstukII_Paragraaf8_Artikel19'],
 ['s20','Binnen de bebouwde kom','HoofdstukII_Paragraaf8_Artikel20'],
 ['s21','Buiten de bebouwde kom','HoofdstukII_Paragraaf8_Artikel21'],
 ['s22','Voertuigen en aanhangwagens','HoofdstukII_Paragraaf8_Artikel22'],
 ['s42','Toegang tot auto(snel)wegen','HoofdstukII_Paragraaf16_Artikel42'],
 ['s45','Maximumsnelheid op een erf','HoofdstukII_Paragraaf17_Artikel45'],
 ['s63','Verkeerstekens en snelheden','HoofdstukIII_Paragraaf1_Artikel63'],
 ['s66','Zoneborden','HoofdstukIII_Paragraaf2_Artikel66'],
 ['s67','Onderborden','HoofdstukIII_Paragraaf2_Artikel67']
].map(([id,title,anchor])=>[id,{title:'RVV · '+title,url:base+'#'+anchor,publisher:'Overheid.nl',reviewed:'2026-09-23',effective:'2026-07-01',note:'Wettelijke bron voor Wereld 3. Voorwaarden staan volledig in de vraag.'}]));
SPEED_SOURCES.rwsSpeed={title:'Rijkswaterstaat · Maximumsnelheden',url:'https://www.rijkswaterstaat.nl/wegen/wetten-regels-en-vergunningen/verkeerswetten/maximumsnelheid',publisher:'Rijkswaterstaat',reviewed:'2026-09-23',note:'Uitleg over tijdvensters, uitzonderingen overdag en de laagste getoonde snelheid bij matrixsignalering.'};
const km=n=>n+' km/u';
// Each item defines a complete scenario, not a rule inferred from a road drawing.
const rows=[
 ['urban','Je rijdt binnen de bebouwde kom. Er zijn geen afwijkende snelheidsborden of zones. Wat is de algemene maximumsnelheid?',50,[30,80],'Voor een personenauto geldt binnen de bebouwde kom in deze situatie maximaal 50 km/u.','s20',{road:'Bebouwde kom'}],
 ['zone30','Je rijdt een aangegeven 30-zone binnen. Wat is hier de maximumsnelheid?',30,[50,60],'Het zonebord stelt hier 30 km/u vast. De gewone komgrens van 50 maakt die lagere limiet niet ongedaan.','s66',{road:'Woonwijk',limit:30,zone:true}],
 ['urban70','Binnen de bebouwde kom staat een geldig maximumsnelheidsbord 70. Er geldt geen andere beperking. Wat is de maximumsnelheid?',70,[50,80],'Een maximumsnelheidsbord kan afwijken van de algemene regel. Onder deze voorwaarden geeft het bord 70 km/u aan.','s63',{road:'Bebouwde kom',limit:70}],
 ['outside','Je rijdt buiten de bebouwde kom op een gewone weg, geen autoweg of autosnelweg. Er zijn geen afwijkende snelheidsborden. Wat is de maximumsnelheid?',80,[60,100],'Buiten de bebouwde kom geldt op een gewone weg voor deze auto in beginsel 80 km/u.','s21',{road:'Gewone weg · buiten de kom'}],
 ['outside60','Op een gewone weg buiten de bebouwde kom geldt bord 60. Er zijn geen andere beperkingen. Wat is de maximumsnelheid?',60,[80,100],'Het bord verlaagt de maximumsnelheid op deze weg tot 60 km/u.','s63',{road:'Buiten de bebouwde kom',limit:60}],
 ['autoweg','Je rijdt op een autoweg buiten de bebouwde kom. Er zijn geen afwijkende snelheidsborden. Wat is de algemene maximumsnelheid?',100,[80,130],'Voor een personenauto zonder aanhangwagen is de algemene limiet op een autoweg buiten de kom 100 km/u.','s21',{road:'Autoweg',sign:'G3'}],
 ['autoweg80','Op een autoweg buiten de bebouwde kom staat bord 80. Wat is de maximumsnelheid?',80,[100,130],'De algemene limiet van het wegtype geeft geen toestemming om het geldige lagere bord te overschrijden.','s63',{road:'Autoweg',limit:80}],
 ['motorwaydefault','Wat is in het RVV de algemene maximumsnelheid voor een personenauto zonder aanhangwagen op een autosnelweg buiten de bebouwde kom, vóór toepassing van afwijkende borden?',130,[100,120],'De wettelijke basis is 130 km/u. In het verkeer bepalen afwijkende borden, tijdvensters en andere beperkingen wat je werkelijk mag rijden.','s21',{road:'Algemene regel · geen routeadvies',sign:'G1'}],
 ['day','Op deze autosnelweg staat 100 met onderbord 6–19 h. Het is 14:00. Er geldt geen andere beperking. Wat is de maximumsnelheid?',100,[120,130],'14:00 valt binnen het aangegeven tijdvenster. Daarom geldt de getoonde 100 km/u.','s67',{road:'Autosnelweg',limit:100,window:'6–19 h',time:'14:00'}],
 ['night','Op deze autosnelweg staat alleen 100 met onderbord 6–19 h. Het is 22:00. Buiten dat tijdvak gelden geen afwijkende borden of beperkingen. Wat is de maximumsnelheid?',130,[100,120],'Het tijdvak van dit bord is voorbij. In deze uitdrukkelijk beschreven situatie geldt dan de algemene snelweglimiet van 130 km/u.','s21',{road:'Autosnelweg',limit:100,window:'6–19 h',time:'22:00'}],
 ['allDay','Op de autosnelweg staat 100 zonder tijdvenster. Het is 22:00. Wat is de maximumsnelheid?',100,[120,130],'Zonder tijdvenster blijft dit bord ook ’s avonds gelden. De klok maakt het bord niet ongeldig.','s63',{road:'Autosnelweg',limit:100,time:'22:00'}],
 ['night120','Het is 21:00. Voor jouw autosnelweg geldt bord 120 met onderbord 19–6 h. Er zijn geen lagere beperkingen. Wat is de maximumsnelheid?',120,[100,130],'21:00 valt binnen het nachtelijke tijdvenster van dit bord. Hier geldt daarom 120 km/u.','s67',{road:'Autosnelweg',limit:120,window:'19–6 h',time:'21:00'}],
 ['dayException','Het is 12:00 op een autosnelweg waar een geldig bord 130 zonder tijdvenster staat. Er zijn geen andere beperkingen. Wat is de maximumsnelheid?',130,[100,120],'Volg de geldende borden op dit traject. Overdag geldt niet op iedere autosnelweg dezelfde limiet; deze vraag geeft expliciet 130 aan.','s63',{road:'Autosnelweg',limit:130,time:'12:00'}],
 ['matrix70','Langs de autosnelweg staat 100. Boven jouw rijstrook geeft de matrixsignalering 70 aan. Wat is de maximumsnelheid?',70,[100,130],'Wanneer de getoonde snelheden verschillen, geldt de laagste getoonde limiet. Hier is dat 70 km/u.','rwsSpeed',{road:'Autosnelweg',limit:100,matrix:70}],
 ['matrix50','Langs de weg staat 100. Boven jouw rijstrook toont het matrixbord 50 vanwege een file. Wat is de maximumsnelheid?',50,[70,100],'De lagere matrixsnelheid geldt. Kan het verkeer nog langzamer rijden of staat het stil, dan pas je je snelheid verder aan.','rwsSpeed',{road:'Filewaarschuwing',limit:100,matrix:50}],
 ['matrixHigher','Langs de weg geldt bord 80. Het matrixbord boven jouw rijstrook toont 100. Welke maximumsnelheid geldt?',80,[100,130],'De hogere matrixwaarde heft het lagere vaste bord niet op. De laagste getoonde limiet blijft gelden.','rwsSpeed',{road:'Autosnelweg',limit:80,matrix:100}],
 ['matrixSame','Zowel het vaste bord als het matrixbord toont 80. Welke maximumsnelheid geldt?',80,[100,120],'Beide tekens geven dezelfde limiet aan: 80 km/u.','rwsSpeed',{road:'Autosnelweg',limit:80,matrix:80}],
 ['erf','Je rijdt op een erf dat met bord G5 is aangegeven. Wat is de maximumsnelheid?',15,[30,50],'Op een erf is de maximumsnelheid 15 km/u. Houd ook rekening met mensen die de weg gebruiken.','s45',{road:'Erf',sign:'G5'}],
 ['zoneTurn','Je bent een 30-zone ingereden en slaat binnen die zone een zijstraat in. Je passeert geen einde-zonebord of andere snelheidsregeling. Wat blijft de maximumsnelheid?',30,[50,80],'Een afslag of kruising beëindigt de zone niet. De zoneregeling blijft in het aangeduide gebied van kracht.','s66',{road:'Binnen dezelfde zone',limit:30,zone:true}],
 ['zoneEnd','Je passeert het einde van een 30-zone en blijft binnen de bebouwde kom. Er geldt geen andere snelheidsbeperking. Wat is nu de algemene maximumsnelheid?',50,[30,80],'Na het einde van de zone geldt hier weer de algemene komlimiet van 50 km/u. Controleer altijd of er andere borden staan.','s20',{road:'Binnen de kom · na einde zone'}],
 ['endLimit','Je passeert A2, einde maximumsnelheid, op een gewone weg buiten de bebouwde kom. Er zijn geen andere beperkingen. Wat is de algemene maximumsnelheid?',80,[100,130],'Het einde van een aangegeven limiet is geen einde van alle snelheidsregels. Voor deze gewone buitenweg geldt 80 km/u.','s21',{road:'Gewone buitenweg',sign:'A2'}],
 ['trailer90','Je rijdt met een personenauto en aanhangwagen waarvan de toegestane maximummassa 1.500 kg is. Op de autosnelweg geldt bord 100. Wat is jouw maximumsnelheid?',90,[100,80],'Met een aanhangwagen met een toegestane maximummassa van maximaal 3.500 kg geldt voor deze combinatie hoogstens 90 km/u.','s22',{road:'Autosnelweg · aanhangwagen TMM 1.500 kg',limit:100}],
 ['trailer80','Je rijdt met een personenauto en aanhangwagen met toegestane maximummassa 1.500 kg. Op jouw autoweg geldt bord 80. Wat is jouw maximumsnelheid?',80,[90,100],'De limiet van 90 voor deze combinatie geeft geen recht om een lager weggebonden bord te overschrijden. Hier geldt 80.','s22',{road:'Autoweg · aanhangwagen TMM 1.500 kg',limit:80}],
 ['trailerHeavy','Je rijdt een toegestane combinatie van een personenauto met een aanhangwagen waarvan de toegestane maximummassa méér dan 3.500 kg is. De snelweg laat 100 toe. Wat is de bijzondere maximumsnelheid voor deze combinatie?',80,[90,100],'Deze combinatie valt buiten de categorie aanhangwagens tot en met 3.500 kg. Hiervoor geldt maximaal 80 km/u, tenzij een lagere beperking geldt.','s22',{road:'Autosnelweg · aanhangwagen TMM boven 3.500 kg',limit:100}],
 ['signG1','Welk wegtype begint bij dit bord?', 'Autosnelweg',['Autoweg','Erf'],'G1 geeft een autosnelweg aan. Bekijk daarnaast de snelheidsborden; het wegtype alleen bepaalt niet de actuele limiet.','rvv',{road:'Herken het wegtype',sign:'G1'}],
 ['signG3','Welk wegtype begint bij dit bord?', 'Autoweg',['Autosnelweg','Verplicht fietspad'],'G3 geeft een autoweg aan. Een autoweg is niet hetzelfde als een autosnelweg.','rvv',{road:'Herken het wegtype',sign:'G3'}],
 ['signG5','Welk gebied begint bij dit bord?', 'Erf',['30-zone','Autosnelweg'],'G5 geeft het begin van een erf aan. De maximumsnelheid op een erf is 15 km/u.','rvv',{road:'Herken het gebied',sign:'G5'}],
 ['entry60','Aan welke snelheidseis moet een motorvoertuig voldoen om de autosnelweg te mogen gebruiken?', 'Het moet minstens 60 km/u mogen én kunnen rijden',['Het moet altijd minimaal 60 km/u rijden','Het moet minstens 50 km/u kunnen rijden'],'Dit is een eis aan wat het voertuig mag en kan. Je hoeft dus niet in een file minimaal 60 te rijden.','s42',{road:'Toegang autosnelweg',sign:'G1'}],
 ['entry50','Aan welke snelheidseis moet een motorvoertuig voldoen om een autoweg te mogen gebruiken?', 'Het moet minstens 50 km/u mogen én kunnen rijden',['Het moet altijd minimaal 50 km/u rijden','Het moet minstens 60 km/u kunnen rijden'],'Voor de autoweg is de toegangseis minstens 50 km/u mogen én kunnen rijden. Dit is geen verplichting om altijd 50 te rijden.','s42',{road:'Toegang autoweg',sign:'G3'}],
 ['moped','Een brommobiel mag en kan maximaal 45 km/u rijden. Mag die een autoweg gebruiken?', 'Nee',['Ja, als het rustig is','Ja, met alarmlichten'],'45 km/u voldoet niet aan de toegangseis van de autoweg. Daar moet het motorvoertuig minstens 50 km/u mogen én kunnen rijden.','s42',{road:'Toegang autoweg',sign:'G3'}],
 ['visibility','De maximumsnelheid is 80, maar door dichte mist kun je de weg nog maar een klein stuk overzien. Wat doe je?', 'Langzamer rijden zodat ik binnen het zichtbare vrije weggedeelte kan stoppen',['80 blijven rijden, want dat mag','Sneller rijden om uit de mist te komen'],'Een limiet is geen opdracht om zo hard te rijden. Je moet kunnen stoppen binnen de afstand die je kunt overzien en die vrij is.','s19',{road:'Beperkt zicht · mist',limit:80,weather:'mist'}],
 ['bend','Je nadert een onoverzichtelijke bocht op een weg met maximum 60. Is 60 rijden daarmee altijd veilig?', 'Nee, ik moet binnen het zichtbare vrije weggedeelte kunnen stoppen',['Ja, want het bord geeft toestemming','Ja, zolang ik richting aangeef'],'De maximumsnelheid en een veilige snelheid zijn niet altijd gelijk. Beperkt zicht kan vereisen dat je langzamer rijdt.','s19',{road:'Onoverzichtelijke bocht',limit:60}],
 ['advisory','Je ziet een blauw vierkant bord A4 met 50. Wat betekent dit?', 'Een adviessnelheid van 50 km/u',['Een verplichte minimumsnelheid van 50 km/u','Een maximumsnelheidsbord met rode rand'],'A4 geeft een adviessnelheid. Dat is iets anders dan het ronde maximumsnelheidsbord A1. Geldende maxima en veilig rijgedrag blijven belangrijk.','rvv',{road:'Lees de bordvorm',advisory:50}],
 ['number','Je ziet alleen het wegnummer N123. Weet je daarmee zeker dat je 100 km/u mag rijden?', 'Nee, ik moet het wegtype en de borden bekijken',['Ja, elk N-nummer betekent 100','Ja, buiten de kom altijd'],'Een wegnummer is geen snelheidsbord. Kijk naar het aangeduide wegtype, de omgeving en de geldende borden.','s21',{road:'Wegnummer N123'}]
];
export const SPEED_QUESTIONS=Object.fromEntries(rows.map(([id,context,right,wrong,explanation,source,scene])=>[id,{id,context,answer:typeof right==='number'?km(right):right,wrong:wrong.map(x=>typeof x==='number'?km(x):x),numeric:typeof right==='number',explanation,sourceIds:[source],scene,sign:null}]));
export const SPEED_CHAPTERS=[{name:'Lees de weg',description:'Kom, buitenweg, autoweg en autosnelweg.',color:'blue'},{name:'Lees het moment',description:'Borden, tijdvakken en matrixsignalering.',color:'mint'},{name:'Ken de uitzondering',description:'Erven, zones, toegang en aanhangwagens.',color:'violet'},{name:'Kies bewust',description:'De limiet kennen én veilig blijven rijden.',color:'gold'}];
const groups=[
 ['Je snelheidsbasis','speed','urban outside autoweg zone30 erf'],
 ['Wegwijzer','roadtype','signG1 signG3 signG5 number autoweg'],
 ['Het bord beslist','speed','urban70 outside60 autoweg80 zone30 allDay'],
 ['Klopt de limiet?','judge','urban outside autoweg urban70 outside60'],
 ['Snelheidsradar','timed','urban zone30 outside autoweg80 erf'],
 ['De klok lezen','speed','day night allDay night120 dayException'],
 ['Boven de rijbaan','speed','matrix70 matrix50 matrixHigher matrixSame allDay'],
 ['Dag of nacht','judge','day night night120 allDay dayException'],
 ['Matrixcheck','judge','matrix70 matrixHigher matrix50 matrixSame outside60'],
 ['Mini-boss: De Matrixwachter','miniboss','urban70 day night allDay matrix70 matrixHigher autoweg80 erf'],
 ['Thuis in de zone','speed','zone30 zoneTurn zoneEnd erf endLimit'],
 ['Mag je deze weg op?','roadtype','entry60 entry50 moped signG1 signG3'],
 ['Met aanhangwagen','speed','trailer90 trailer80 trailerHeavy outside60 urban'],
 ['Uitzonderingscheck','judge','trailer90 trailer80 trailerHeavy zoneTurn zoneEnd'],
 ['Bordenblik','timed','signG1 signG3 signG5 advisory number'],
 ['Veilig boven alles','roadtype','visibility bend advisory entry60 entry50'],
 ['Van weg naar weg','speed','endLimit zoneEnd outside autoweg motorwaydefault'],
 ['Jij controleert Mursal','judge','matrixHigher night allDay trailer90 erf'],
 ['De laatste training','mixed','dayException visibility moped matrix50 trailerHeavy zoneTurn'],
 ['Boss: De Snelheidsmeester','boss','day night allDay matrixHigher trailer90 trailer80 zoneEnd entry60 visibility advisory']
];
export const SPEED_LEVELS=groups.map(([name,mode,codes],i)=>({id:41+i,number:i+1,worldId:'speed',chapter:Math.floor(i/5),name,mode,codes:codes.split(' '),count:codes.split(' ').length,pass:['boss','miniboss'].includes(mode)?.8:.6,seconds:mode==='timed'?25:null,boss:['boss','miniboss'].includes(mode)}));
