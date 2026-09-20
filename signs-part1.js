// Deel 1 van de uitgebreide Nederlandse verkeersbordenbank.
(function () {
  const faTerms = [
    ['Gesloten voor', 'ممنوع برای'], ['Einde', 'پایان'], ['Maximumsnelheid', 'حداکثر سرعت'],
    ['Adviessnelheid', 'سرعت پیشنهادی'], ['Voorrangskruispunt', 'تقاطع با حق تقدم'], ['Voorrangsweg', 'جاده دارای حق تقدم'],
    ['Verleen voorrang', 'حق تقدم بدهید'], ['Stop en verleen voorrang', 'توقف و حق تقدم بدهید'], ['Eenrichtingsweg', 'جاده یک‌طرفه'],
    ['Rotonde', 'میدان'], ['Parkeergelegenheid', 'محل پارک'], ['Parkeerverbod', 'پارک ممنوع'], ['Gehandicaptenparkeerplaats', 'پارک معلولان'],
    ['Laden en lossen', 'بارگیری و تخلیه'], ['Milieuzone', 'منطقه محیط‌زیست'], ['Inhaalverbod', 'ممنوعیت سبقت'], ['Verboden voor', 'ممنوع برای'],
    ['Overweg', 'گذرگاه راه‌آهن'], ['Rijbaanversmalling', 'باریک شدن جاده'], ['Bocht naar rechts', 'پیچ به راست'], ['Bocht naar links', 'پیچ به چپ'],
    ['Gevaarlijk kruispunt', 'تقاطع خطرناک'], ['Kinderen', 'کودکان'], ['Voetgangersoversteekplaats', 'گذرگاه عابر پیاده'],
    ['Fietsers en bromfietsers', 'دوچرخه‌سواران و موتورسیکلت‌ها'], ['Filevorming', 'ترافیک سنگین'], ['Werk in uitvoering', 'کارهای جاده‌ای'],
    ['Tegenliggers', 'خودروهای روبه‌رو'], ['Beweegbare brug', 'پل متحرک'], ['Zijwind', 'باد جانبی'], ['IJzel of sneeuw', 'یخ یا برف'],
    ["vrachtauto's", 'کامیون‌ها'], ['autobussen', 'اتوبوس‌ها'], ['motorvoertuigen', 'وسایل نقلیه موتوری'], ['landbouwvoertuigen', 'ماشین‌آلات کشاورزی'],
    ['bromfietsen', 'موتورسیکلت‌های سبک'], ['snorfietsen', 'اسکوترها'], ['fietsen', 'دوچرخه‌ها'], ['voetgangers', 'عابران پیاده'], ['rijstroken', 'خطوط عبور'],
    ['Parkeren', 'پارک'], ['parkeerschijfzone', 'منطقه پارک با دیسک'], ['autosnelweg', 'بزرگراه'], ['autoweg', 'جاده مخصوص موتر'], ['busbaan', 'خط اتوبوس'],
    ['fietspad', 'مسیر دوچرخه'], ['S-bocht(en)', 'پیچ‌های S'], ['Groot wild', 'حیوانات وحشی بزرگ'], ['Ongeval', 'تصادف'], ['Steile helling', 'سربالایی تند']
  ];
  const faName = (name) => { let value = name; faTerms.forEach(([nl, fa]) => { value = value.replace(nl, fa); }); return value === name ? `تابلوی ${name}` : value; };
  const info = (name) => `Dit bord geeft de verkeersregel voor ${name.toLowerCase()}. Kijk naar de volledige situatie en volg het bord tijdig.`;
  const faInfo = (name) => `این تابلو قانون «${faName(name)}» را نشان می‌دهد. وضعیت کامل راه را بررسی کنید و به‌موقع طبق تابلو عمل کنید.`;
  const rows = [
    ['C7b','prohibition',"Gesloten voor vrachtauto's en autobussen",'mt-part1-001.jpg'],['C7b-end','information',"Einde gesloten voor vrachtauto's en autobussen",'mt-part1-002.jpg'],['L6','information','Splitsing van rijstroken','mt-part1-003.jpg'],['L6-end','information','Einde splitsing van rijstroken','mt-part1-004.jpg'],['L7','information','Aantal doorgaande rijstroken','mt-part1-005.jpg'],['C22b','prohibition','Einde milieuzone','mt-part1-006.jpg'],['D2','mandatory','Gebod rechts voorbij te gaan','mt-part1-007.jpg'],['D3','mandatory','Gebod links of rechts voorbij te gaan','mt-part1-008.jpg'],['D5','mandatory','Gebod rechtsaf te rijden','mt-part1-009.jpg'],['D6','mandatory','Gebod rechtdoor of rechtsaf','mt-part1-010.jpg'],['D7','mandatory','Gebod rechtdoor of linksaf','mt-part1-011.jpg'],['E5','information','Taxistandplaats','mt-part1-012.jpg'],['E7','information','Laden en lossen','mt-part1-013.jpg'],['E6','information','Gehandicaptenparkeerplaats','mt-part1-014.jpg'],['E8b','information',"Parkeren voor personenauto's",'mt-part1-015.jpg'],['E8c','information','Parkeren voor voertuigen met aanhanger','mt-part1-016.jpg'],['E3','prohibition','Verbod fietsen en bromfietsen te plaatsen','mt-part1-017.jpg'],['E8a','information',"Parkeren voor vrachtauto's",'mt-part1-018.jpg'],['E9','information','Parkeren voor vergunninghouders','mt-part1-019.jpg'],['E10','information','Parkeerschijfzone','mt-part1-020.jpg'],['E11','information','Einde parkeerschijfzone','mt-part1-021.jpg'],['E12','information','Parkeergelegenheid voor openbaar vervoer','mt-part1-022.jpg'],['E13','information','Parkeergelegenheid voor carpoolers','mt-part1-023.jpg'],['E14','information',"Parkeergelegenheid voor elektrische auto's",'mt-part1-024.jpg'],['A2','prohibition','Einde maximumsnelheid','mt-part1-025.jpg'],['A3','prohibition','Maximumsnelheid op elektronisch signaleringsbord','mt-part1-026.jpg'],['A4','information','Adviessnelheid','mt-part1-027.jpg'],['A5','information','Einde adviessnelheid','mt-part1-028.jpg'],['B4','priority','Voorrangskruispunt met zijweg links','mt-part1-029.jpg'],['B5','priority','Voorrangskruispunt met zijweg rechts','mt-part1-030.jpg'],['B3','priority','Voorrangskruispunt','mt-part1-031.jpg'],['C1','prohibition','Gesloten in beide richtingen','mt-part1-032.jpg'],['C3','mandatory','Eenrichtingsweg rechtdoor','mt-part1-033.jpg'],['C4','mandatory','Eenrichtingsweg naar rechts','mt-part1-034.jpg'],['C5','information','Inrijden toegestaan','mt-part1-035.jpg'],['C6','prohibition','Gesloten voor motorvoertuigen op meer dan twee wielen','mt-part1-036.jpg'],['C7','prohibition',"Gesloten voor vrachtauto's",'mt-part1-037.jpg'],['C7a','prohibition','Gesloten voor autobussen','mt-part1-038.jpg'],['C7b-truckbus','prohibition',"Gesloten voor vrachtauto's en autobussen",'mt-part1-039.jpg'],['C8','prohibition','Gesloten voor landbouwvoertuigen','mt-part1-040.jpg'],['C9','prohibition','Gesloten voor ruiters, vee en landbouwvoertuigen','mt-part1-041.jpg'],['C10','prohibition','Gesloten voor motorvoertuigen met aanhangwagen','mt-part1-042.jpg'],['C11','prohibition','Gesloten voor motorfietsen','mt-part1-043.jpg'],['C12','prohibition','Gesloten voor alle motorvoertuigen','mt-part1-044.jpg'],['C13','prohibition','Gesloten voor bromfietsen en snorfietsen','mt-part1-045.jpg'],['C14','prohibition','Gesloten voor fietsen en gehandicaptenvoertuigen','mt-part1-046.jpg'],['C17','prohibition','Gesloten voor voertuigen langer dan 10 meter','mt-part1-047.jpg'],['C22','prohibition','Gesloten voor voertuigen met gevaarlijke stoffen','mt-part1-048.jpg'],['C21','prohibition','Gesloten voor voertuigen zwaarder dan 5,4 ton','mt-part1-049.jpg'],['C16','prohibition','Gesloten voor voetgangers','mt-part1-050.jpg'],['C18','prohibition','Gesloten voor voertuigen breder dan 2,3 meter','mt-part1-051.jpg'],['C19','prohibition','Gesloten voor voertuigen hoger dan 3,1 meter','mt-part1-052.jpg'],['C22a','information','Milieuzone','mt-part1-053.jpg'],['C15','prohibition','Gesloten voor fietsen en bromfietsen met gehandicaptenvoertuigen','mt-part1-054.jpg'],['C20','prohibition','Gesloten voor voertuigen met aslast hoger dan 4,8 ton','mt-part1-055.jpg'],
    ['F9','information','Einde alle verboden op elektronisch signaleringsbord','mt-part1-056.jpg'],['J38','warning','Verkeersdrempel','mt-part1-057.jpg'],['J10','warning','Overweg met slagbomen','mt-part1-058.jpg'],['G2','information','Einde autosnelweg','mt-part1-059.jpg'],['G4','information','Einde autoweg','mt-part1-060.jpg'],['H2','information','Einde bebouwde kom','mt-part1-061.jpg'],['F14','information','Einde busbaan of busstrook','mt-part1-062.jpg'],['G12b','information','Einde fiets- en bromfietspad','mt-part1-063.jpg'],['G12','information','Einde verplicht fietspad','mt-part1-064.jpg'],['F2','prohibition','Einde inhaalverbod','mt-part1-065.jpg'],['F4','prohibition',"Einde inhaalverbod voor vrachtauto's",'mt-part1-066.jpg'],['F8','information','Einde van alle beperkingen','mt-part1-067.jpg'],['G5','information','Einde erf of speelstraat','mt-part1-068.jpg'],['G5-family','information','Erf met voetgangers, auto en woning','mt-part1-069.jpg'],['C14-ban','prohibition','Verboden voor fietsen','mt-part1-070.jpg'],['J12','warning','Overweg met enkel spoor','mt-part1-071.jpg'],['F1','prohibition','Inhaalverbod voor motorvoertuigen','mt-part1-072.jpg'],['F3','prohibition',"Inhaalverbod voor vrachtauto's",'mt-part1-073.jpg'],['K2','information','Voorwegwijzer langs autosnelweg','mt-part1-074.jpg'],['K1','information','Beslissingswegwijzer autosnelweg','mt-part1-075.jpg'],['J23','warning','Kinderen of voetgangers in de omgeving','mt-part1-076.jpg'],['F7','prohibition','Keerverbod','mt-part1-077.jpg'],['J24','warning','Fietsers en bromfietsers','mt-part1-078.jpg'],['J14','warning','Tramkruising','mt-part1-079.jpg'],['G9','prohibition','Ruiterpad verboden voor andere weggebruikers','mt-part1-080.jpg'],['G8','prohibition','Verboden voor voetgangers','mt-part1-081.jpg'],['F11','mandatory','Verplichte passeerstrook voor landbouw- en bosbouwtrekkers','mt-part1-082.jpg'],['C7b-tram','prohibition','Verboden voor tram en bus','mt-part1-083.jpg'],['C13-tram','prohibition','Verboden voor trams','mt-part1-084.jpg'],['J4','warning','S-bocht(en), eerst naar rechts','mt-part1-085.jpg'],['G7','information','Voetpad voor voetgangers','mt-part1-086.jpg'],['J11','warning','Overweg zonder slagbomen','mt-part1-087.jpg'],['J18','warning','Rijbaanversmalling rechts','mt-part1-088.jpg'],['J20','warning','Slipgevaar','mt-part1-089.jpg'],['J21','warning','Kinderen','mt-part1-090.jpg'],['J28','warning','Vee','mt-part1-091.jpg'],['J39','warning','Beweegbare paal','mt-part1-092.jpg'],['J25','warning','Losliggende stenen','mt-part1-093.jpg'],['J2','warning','Bocht naar rechts','mt-part1-094.jpg'],['J7','warning','Gevaarlijke daling','mt-part1-095.jpg'],['J22','warning','Voetgangersoversteekplaats','mt-part1-096.jpg'],['J17','warning','Rijbaanversmalling','mt-part1-097.jpg'],['J32','warning','Verkeerslichten','mt-part1-098.jpg'],['J3','warning','Bocht naar links','mt-part1-099.jpg'],['J6','warning','Steile helling','mt-part1-100.jpg'],['J19','warning','Rijbaanversmalling links','mt-part1-101.jpg'],['J8','warning','Gevaarlijk kruispunt','mt-part1-102.jpg'],['J27','warning','Groot wild','mt-part1-103.jpg'],['J31','warning','Zijwind','mt-part1-104.jpg'],['B3-arrows','priority','Voorrangskruispunt met pijlen','mt-part1-105.jpg'],['J26','warning','Kade of rivier oever','mt-part1-106.jpg'],['J15','warning','Beweegbare brug','mt-part1-107.jpg'],['J5','warning','S-bocht(en), eerst naar links','mt-part1-108.jpg'],['J9','warning','Rotonde','mt-part1-109.jpg'],['J30','warning','Laagvliegende vliegtuigen','mt-part1-110.jpg'],['J33','warning','Filevorming','mt-part1-111.jpg'],['J36','warning','IJzel of sneeuw','mt-part1-112.jpg'],['J34','warning','Ongeval','mt-part1-113.jpg'],['J35','warning','Slecht zicht door sneeuw, regen of mist','mt-part1-114.jpg'],['J16','warning','Werk in uitvoering','mt-part1-115.jpg'],['J29','warning','Tegenliggers','mt-part1-116.jpg']
  ];
  // The source pack contains the existing B7 stop sign and omits a separate
  // C20 image. Keep the existing board in the static catalogue, skip that
  // duplicate here, and align the following C-series images with their codes.
  const fileFix = { C1: 'mt-part1-033.jpg', C3: 'mt-part1-034.jpg', C4: 'mt-part1-035.jpg', C5: 'mt-part1-036.jpg', C6: 'mt-part1-037.jpg', C7: 'mt-part1-038.jpg', C7a: 'mt-part1-039.jpg', C8: 'mt-part1-041.jpg', C9: 'mt-part1-042.jpg', C10: 'mt-part1-043.jpg', C11: 'mt-part1-044.jpg', C12: 'mt-part1-045.jpg', C13: 'mt-part1-046.jpg', C14: 'mt-part1-054.jpg', C17: 'mt-part1-047.jpg', C22: 'mt-part1-048.jpg', C21: 'mt-part1-049.jpg', C16: 'mt-part1-050.jpg', C18: 'mt-part1-051.jpg', C19: 'mt-part1-052.jpg', C22a: 'mt-part1-053.jpg', C15: 'mt-part1-055.jpg' };
  window.MT_SIGNS_PART1 = rows.filter(([code]) => code !== 'C20' && code !== 'C7b-truckbus').map(([code, category, name, file]) => [code, category, `part1-${code}`, name, faName(name), info(name), faInfo(name), `/images/signs/part1/${fileFix[code] || file}`]);
  // Replace the synthetic suffix entries with the official owner-supplied
  // boards and add the newly supplied C20, C22c/d and C23 images.
  const ownerFiles = {
    C7b: 'mt-owner-c7b.jpg',
    C20: 'mt-owner-c20.jpg',
    C22c: 'mt-owner-c22c.jpg',
    C22d: 'mt-owner-c22d.jpg',
    'C23-01': 'mt-owner-c23-01.jpg',
    'C23-02': 'mt-owner-c23-02.jpg',
    'C23-03': 'mt-owner-c23-03.jpg'
  };
  const removeCodes = new Set(['C7b-end', 'C7b-tram', 'C13-tram', 'C14-ban']);
  const addedRows = [
    ['C20', 'prohibition', 'Gesloten voor voertuigen met aslast hoger dan 4,8 ton'],
    ['C22c', 'prohibition', "Gesloten voor bedrijfs- en vrachtauto's vanwege nul-emissiezone"],
    ['C22d', 'information', 'Einde nul-emissiezone'],
    ['C23-01', 'information', 'Aan de rijbaan is een spitsstrook toegevoegd'],
    ['C23-02', 'information', 'De spitsstrook moet worden vrijgemaakt'],
    ['C23-03', 'information', 'Einde van de spitsstrook']
  ];
  window.MT_SIGNS_PART1 = window.MT_SIGNS_PART1
    .filter(([code]) => !removeCodes.has(code))
    .map((sign) => ownerFiles[sign[0]]
      ? [...sign.slice(0, 7), `/images/signs/part1/${ownerFiles[sign[0]]}`]
      : sign)
    .concat(addedRows.map(([code, category, name]) => [
      code, category, `part1-${code}`, name, faName(name), info(name), faInfo(name), `/images/signs/part1/${ownerFiles[code]}`
    ]));
  // Authoritative archive catalogue. Every board uses its own supplied image; legacy/synthetic entries are excluded.
  const archiveCodes = ["A1","A2","A3","A4","A5","B1","B2","B3","B4","B5","B6","B7","C1","C2","C3","C4","C5","C6","C7","C7a","C7b","C8","C9","C10","C11","C12","C13","C14","C15","C16","C17","C18","C19","C20","C21","C22","C22a","C22b","C22c","C22d","C23-01","C23-02","C23-03","D1","D2","D3","D4","D5","D6","D7","E1","E2","E3","E4","E5","E6","E7","E8","E8a","E8b","E9","E10","E11","E12","E13","E14","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","G11","G12","G12a","G12b","G13","G14","H1","H2","J1","J2","J3","J4","J5","J6","J7","J8","J9","J10","J11","J12","J13","J14","J15","J16","J17","J18","J19","J20","J21","J22","J23","J24","J25","J26","J27","J28","J29","J30","J31","J32","J33","J34","J35","J36","J37","J38","J39","K1","K2.1"];
  const archiveNames = {"A1":"Maximumsnelheid 50 km/u","B1":"Voorrangsweg","B2":"Einde voorrangsweg","B6":"Verleen voorrang aan bestuurders op de kruisende weg","B7":"Stop en verleen voorrang","C1":"Gesloten in beide richtingen","C2":"Eenrichtingsweg, gesloten in deze richting","C3":"Eenrichtingsweg rechtdoor","C4":"Eenrichtingsweg naar rechts","C5":"Inrijden toegestaan","C6":"Gesloten voor motorvoertuigen op meer dan twee wielen","C7":"Gesloten voor vrachtauto's","C7a":"Gesloten voor autobussen","C7b":"Gesloten voor vrachtauto's en autobussen","C8":"Gesloten voor landbouwvoertuigen","C9":"Gesloten voor ruiters, vee en landbouwvoertuigen","C10":"Gesloten voor motorvoertuigen met aanhangwagen","C11":"Gesloten voor motorfietsen","C12":"Gesloten voor alle motorvoertuigen","C13":"Gesloten voor bromfietsen en snorfietsen","C14":"Gesloten voor fietsen en gehandicaptenvoertuigen","C15":"Gesloten voor fietsen, bromfietsen en gehandicaptenvoertuigen","C16":"Gesloten voor voetgangers","C17":"Gesloten voor voertuigen langer dan 10 meter","C18":"Gesloten voor voertuigen breder dan 2,3 meter","C19":"Gesloten voor voertuigen hoger dan 3,1 meter","C20":"Gesloten voor voertuigen met aslast hoger dan 4,8 ton","C21":"Gesloten voor voertuigen met totale massa hoger dan 5,4 ton","C22":"Gesloten voor voertuigen met gevaarlijke stoffen","C22a":"Milieuzone","C22b":"Einde milieuzone","C22c":"Gesloten voor bedrijfs- en vrachtauto's vanwege nul-emissiezone","C22d":"Einde nul-emissiezone","C23-01":"Aan de rijbaan is een spitsstrook toegevoegd","C23-02":"De spitsstrook moet worden vrijgemaakt","C23-03":"Einde van de spitsstrook","D1":"Rotonde, verplichte rijrichting","D2":"Gebod rechts voorbij te gaan","D3":"Gebod links of rechts voorbij te gaan","D4":"Gebod rechtdoor te rijden","D5":"Gebod rechtsaf te rijden","D6":"Gebod rechtdoor of rechtsaf","D7":"Gebod rechtdoor of linksaf","E1":"Parkeerverbod","E2":"Verbod stil te staan","E3":"Verbod fietsen en bromfietsen te plaatsen","E4":"Parkeergelegenheid","E5":"Taxistandplaats","E6":"Gehandicaptenparkeerplaats","E7":"Gelegenheid bestemd voor het onmiddellijk laden en lossen van goederen","E8":"Parkeergelegenheid voor voertuigen","E8a":"Parkeergelegenheid alleen bestemd voor voertuigen die op het bord zijn aangegeven","E8b":"Parkeren met twee wielen op het trottoir toegestaan","E8c":"Parkeren voor voertuigen met aanhanger","E9":"Parkeergelegenheid alleen bestemd voor vergunninghouders","E10":"Parkeerschijfzone","E11":"Einde parkeerschijfzone","E12":"Parkeergelegenheid ten behoeve van openbaar vervoer","E13":"Parkeergelegenheid ten behoeve van carpoolers","E14":"Parkeergelegenheid ten behoeve van elektrische auto's","F1":"Inhaalverbod voor motorvoertuigen","F2":"Einde inhaalverbod voor motorvoertuigen","F3":"Inhaalverbod voor vrachtauto's","F4":"Einde inhaalverbod voor vrachtauto's","F5":"Verbod door te gaan bij tegenliggers","F6":"Tegenliggers moeten voorrang geven","F7":"Keerverbod","F8":"Einde van alle verboden","F9":"Einde verboden op elektronisch signaleringsbord","F10":"Stop","F11":"Verplichte passeerstrook voor landbouw- en bosbouwtrekkers","F12":"Einde verplichte passeerstrook","F13":"Busbaan of busstrook","F14":"Einde busbaan of busstrook","F15":"Trambaan of tramstrook","F16":"Einde trambaan of tramstrook","F17":"Bus- en trambaan of -strook","F18":"Einde bus- en trambaan of -strook","F19":"Rijbaan voor vrachtauto's en lijnbussen","F20":"Einde rijbaan voor vrachtauto's en lijnbussen","F21":"Rijbaan voor vrachtauto's","F22":"Einde rijbaan voor vrachtauto's","G1":"Autosnelweg","G2":"Einde autosnelweg","G3":"Autoweg","G4":"Einde autoweg","G5":"Erf","G6":"Einde erf","G7":"Voetpad","G8":"Einde voetpad","G9":"Ruiterpad","G10":"Einde ruiterpad","G11":"Verplicht fietspad","G12":"Einde verplicht fietspad","G12a":"Fiets- en bromfietspad","G12b":"Einde fiets- en bromfietspad","G13":"Onverplicht fietspad","G14":"Einde onverplicht fietspad","H1":"Bebouwde kom","H2":"Einde bebouwde kom","J1":"Slecht wegdek","J2":"Bocht naar rechts","J3":"Bocht naar links","J4":"S-bocht(en), eerst naar rechts","J5":"S-bocht(en), eerst naar links","J6":"Steile helling","J7":"Gevaarlijke daling","J8":"Gevaarlijk kruispunt","J9":"Rotonde","J10":"Overweg met slagbomen","J11":"Overweg zonder slagbomen","J12":"Overweg met enkel spoor","J13":"Overweg met twee of meer sporen","J14":"Tramkruising","J15":"Beweegbare brug","J16":"Werk in uitvoering","J17":"Rijbaanversmalling","J18":"Rijbaanversmalling rechts","J19":"Rijbaanversmalling links","J20":"Slipgevaar","J21":"Kinderen","J22":"Voetgangersoversteekplaats","J23":"Voetgangers","J24":"Fietsers en bromfietsers","J25":"Losliggende stenen","J26":"Kade of rivierover","J27":"Groot wild","J28":"Vee","J29":"Tegenliggers","J30":"Laagvliegende vliegtuigen","J31":"Zijwind","J32":"Verkeerslichten","J33":"Filevorming","J34":"Ongeval","J35":"Slecht zicht door sneeuw, regen of mist","J36":"IJzel of sneeuw","J37":"Gevaar","J38":"Verkeersdrempel","J39":"Beweegbare paal","K1":"Beslissingswegwijzer langs autosnelweg","K2":"Voorwegwijzer langs autosnelweg","K2.1":"Voorwegwijzer langs autosnelweg"};
  const archiveCategories = {"A1":"prohibition","B1":"priority","B2":"priority","B6":"priority","B7":"priority","C1":"prohibition","C2":"prohibition","C3":"mandatory","C4":"mandatory","C5":"information","C6":"prohibition","C7":"prohibition","C7a":"prohibition","C7b":"prohibition","C8":"prohibition","C9":"prohibition","C10":"prohibition","C11":"prohibition","C12":"prohibition","C13":"prohibition","C14":"prohibition","C15":"prohibition","C16":"prohibition","C17":"prohibition","C18":"prohibition","C19":"prohibition","C20":"prohibition","C21":"prohibition","C22":"prohibition","C22a":"information","C22b":"information","C22c":"prohibition","C22d":"information","C23-01":"information","C23-02":"information","C23-03":"information","D1":"mandatory","D2":"mandatory","D3":"mandatory","D4":"mandatory","D5":"mandatory","D6":"mandatory","D7":"mandatory","E1":"prohibition","E2":"prohibition","E3":"prohibition","E4":"information","E5":"information","E6":"information","E7":"information","E8":"information","E8a":"information","E8b":"information","E8c":"information","E9":"information","E10":"information","E11":"information","E12":"information","E13":"information","E14":"information","F1":"prohibition","F2":"prohibition","F3":"prohibition","F4":"prohibition","F5":"prohibition","F6":"mandatory","F7":"prohibition","F8":"information","F9":"information","F10":"prohibition","F11":"mandatory","F12":"information","F13":"information","F14":"information","F15":"information","F16":"information","F17":"information","F18":"information","F19":"information","F20":"information","F21":"information","F22":"information","G1":"information","G2":"information","G3":"information","G4":"information","G5":"information","G6":"information","G7":"information","G8":"information","G9":"information","G10":"information","G11":"information","G12":"information","G12a":"information","G12b":"information","G13":"information","G14":"information","H1":"information","H2":"information","J1":"warning","J2":"warning","J3":"warning","J4":"warning","J5":"warning","J6":"warning","J7":"warning","J8":"warning","J9":"warning","J10":"warning","J11":"warning","J12":"warning","J13":"warning","J14":"warning","J15":"warning","J16":"warning","J17":"warning","J18":"warning","J19":"warning","J20":"warning","J21":"warning","J22":"warning","J23":"warning","J24":"warning","J25":"warning","J26":"warning","J27":"warning","J28":"warning","J29":"warning","J30":"warning","J31":"warning","J32":"warning","J33":"warning","J34":"warning","J35":"warning","J36":"warning","J37":"warning","J38":"warning","J39":"warning","K1":"information","K2":"information","K2.1":"information"};
  const existingByCode = new Map(window.MT_SIGNS_PART1.map((sign) => [String(sign[0]).toUpperCase(), sign]));
  window.MT_SIGNS_PART1 = archiveCodes.map((code) => {
    const existing = existingByCode.get(code.toUpperCase());
    const name = archiveNames[code] || (existing && existing[3]) || ('Verkeersbord ' + code);
    const category = archiveCategories[code] || (existing && existing[1]) || 'information';
    return [code, category, 'archive-' + code, name, faName(name), info(name), faInfo(name), '/images/signs/part1/archive-' + code.toLowerCase() + '.jpg'];
  });
})();

/* PASHTO_SIGN_TRANSLATIONS_START */
(function () {
  const titles = {
  "A1": "اعظمي سرعت ۵۰ کیلومتره په ساعت",
  "A2": "د اعظمي سرعت پای",
  "A3": "پر برېښنايي نښه اعظمي سرعت",
  "A4": "سپارښتل شوی سرعت",
  "A5": "د سپارښتل شوي سرعت پای",
  "B1": "د لومړیتوب سړک",
  "B2": "د لومړیتوب سړک پای",
  "B3": "د لومړیتوب څلورلارې",
  "B4": "د لومړیتوب څلورلارې؛ فرعي سړک له چپ لوري",
  "B5": "د لومړیتوب څلورلارې؛ فرعي سړک له ښي لوري",
  "B6": "پر متقاطع سړک چلوونکو ته لومړیتوب ورکړئ",
  "B7": "ودرېږئ او لومړیتوب ورکړئ",
  "C1": "په دواړو لورو د ټولو وسایطو تګ منع دی",
  "C2": "له دې لوري ننوتل منع دي",
  "C3": "یو طرفه سړک؛ مخامخ",
  "C4": "یو طرفه سړک؛ ښي لور ته",
  "C5": "له دواړو لورو ننوتل اجازه لري",
  "C6": "له دوو څخه د زیاتو څرخونو لرونکو موټري وسایطو تګ منع دی",
  "C7": "د لاریو تګ منع دی",
  "C7a": "د بسونو تګ منع دی",
  "C7b": "د لاریو او بسونو تګ منع دی",
  "C8": "د کرنیزو او ځنګلي وسایطو تګ منع دی",
  "C9": "د آس سپرو، څارویو او کرنیزو وسایطو تګ منع دی",
  "C10": "د ټریلر لرونکو موټري وسایطو تګ منع دی",
  "C11": "د موټرسایکلونو تګ منع دی",
  "C12": "د ټولو موټري وسایطو تګ منع دی",
  "C13": "د موپېډونو او سپکو موټرسایکلونو تګ منع دی",
  "C14": "د بایسکلونو او د معلولینو د وسایطو تګ منع دی",
  "C15": "د بایسکلونو، موپېډونو او د معلولینو د وسایطو تګ منع دی",
  "C16": "د پیاده کسانو تګ منع دی",
  "C17": "له ۱۰ مترو څخه د اوږدو وسایطو تګ منع دی",
  "C18": "له ۲٫۳ مترو څخه د پلنو وسایطو تګ منع دی",
  "C19": "له ۳٫۱ مترو څخه د لوړو وسایطو تګ منع دی",
  "C20": "له ۴٫۸ ټنو څخه د زیات محوري بار لرونکو وسایطو تګ منع دی",
  "C21": "له ۵٫۴ ټنو څخه د زیات ټولیز وزن لرونکو وسایطو تګ منع دی",
  "C22": "د خطرناکو موادو لېږدوونکو وسایطو تګ منع دی",
  "C22a": "چاپېریالي سیمه",
  "C22b": "د چاپېریالي سیمې پای",
  "C22c": "بې اخراجه سیمه؛ د سوداګریزو موټرو او لاریو تګ منع دی",
  "C22d": "د بې اخراجه سیمې پای",
  "C23-01": "سړک ته د ګڼې ګوڼې اضافي کرښه ورزیاته شوې",
  "C23-02": "د ګڼې ګوڼې اضافي کرښه باید تشه شي",
  "C23-03": "د ګڼې ګوڼې د اضافي کرښې پای",
  "D1": "ګردچاپېر؛ ټاکلی لوری اجباري دی",
  "D2": "له ښي لوري تېرېدل اجباري دي",
  "D3": "له چپ یا ښي لوري تېرېدل اجباري دي",
  "D4": "مخامخ تلل اجباري دي",
  "D5": "ښي لور ته تلل اجباري دي",
  "D6": "مخامخ یا ښي لور ته تلل اجباري دي",
  "D7": "مخامخ یا چپ لور ته تلل اجباري دي",
  "E1": "پارک کول منع دي",
  "E2": "درېدل منع دي",
  "E3": "د بایسکلونو او موپېډونو درول منع دي",
  "E4": "د پارک کولو ځای",
  "E5": "د ټکسي تمځای",
  "E6": "د معلولینو د پارک ځای",
  "E7": "یوازې د توکو د سمدستي بارولو او کښته کولو ځای",
  "E8": "د ښودل شوي ډول وسایطو د پارک ځای",
  "E8a": "یوازې په نښه کې ښودل شوو وسایطو ته د پارک ځای",
  "E8b": "په پیاده‌رو د دوو څرخونو ایښودلو سره پارک اجازه لري",
  "E9": "یوازې د جواز لرونکو لپاره د پارک ځای",
  "E10": "د پارک ډیسک سیمه",
  "E11": "د پارک ډیسک سیمې پای",
  "E12": "د عامه ترانسپورت لپاره د پارک ځای",
  "E13": "د ګډ سفر کوونکو لپاره د پارک ځای",
  "E14": "د برېښنايي موټرو لپاره د پارک او چارج ځای",
  "F1": "د موټري وسایطو لپاره سبقت منع دی",
  "F2": "د موټري وسایطو د سبقت منع پای",
  "F3": "د لاریو لپاره سبقت منع دی",
  "F4": "د لاریو د سبقت منع پای",
  "F5": "د مقابل لوري د ترافیک پر وړاندې تېرېدل منع دي",
  "F6": "د مقابل لوري وسایط باید تاسو ته لومړیتوب درکړي",
  "F7": "بېرته راګرځېدل منع دي",
  "F8": "د ټولو منع شویو حکمونو پای",
  "F9": "پر برېښنايي نښه د منع شویو حکمونو پای",
  "F10": "ودرېږئ",
  "F11": "د کرنیزو او ځنګلي ټراکټورونو لپاره اجباري څنګیزه کرښه",
  "F12": "د اجباري څنګیزې کرښې پای",
  "F13": "د بس ځانګړې کرښه",
  "F14": "د بس ځانګړې کرښې پای",
  "F15": "د ټرام ځانګړې کرښه",
  "F16": "د ټرام ځانګړې کرښې پای",
  "F17": "د بس او ټرام ځانګړې کرښه",
  "F18": "د بس او ټرام ځانګړې کرښې پای",
  "F19": "د لاریو او ښاري بسونو ځانګړی سړک",
  "F20": "د لاریو او ښاري بسونو د ځانګړي سړک پای",
  "F21": "د لاریو ځانګړی سړک",
  "F22": "د لاریو د ځانګړي سړک پای",
  "G1": "موټروې",
  "G2": "د موټروې پای",
  "G3": "د موټرو ځانګړی سړک",
  "G4": "د موټرو د ځانګړي سړک پای",
  "G5": "استوګنیزه ګډه سیمه",
  "G6": "د استوګنیزې ګډې سیمې پای",
  "G7": "د پیاده کسانو لاره",
  "G8": "د پیاده کسانو د لارې پای",
  "G9": "د آس سپرو لاره",
  "G10": "د آس سپرو د لارې پای",
  "G11": "اجباري بایسکل لاره",
  "G12": "د اجباري بایسکل لارې پای",
  "G12a": "د بایسکل او موپېډ ګډه لاره",
  "G12b": "د بایسکل او موپېډ د ګډې لارې پای",
  "G13": "غیراجباري بایسکل لاره",
  "G14": "د غیراجباري بایسکل لارې پای",
  "H1": "د ښار یا ابادې سیمې پیل",
  "H2": "د ښار یا ابادې سیمې پای",
  "J1": "خراب سړک",
  "J2": "ښي لور ته خطرناک تاو",
  "J3": "چپ لور ته خطرناک تاو",
  "J4": "پرله‌پسې تاوونه؛ لومړی ښي لور ته",
  "J5": "پرله‌پسې تاوونه؛ لومړی چپ لور ته",
  "J6": "سخته پورته خېژنه",
  "J7": "خطرناکه ښکته ځوړنده",
  "J8": "خطرناکه څلورلارې",
  "J9": "ګردچاپېر مخکې دی",
  "J10": "د دروازو لرونکې د اورګاډي پټلۍ",
  "J11": "بې دروازو د اورګاډي پټلۍ",
  "J12": "د اورګاډي پټلۍ؛ یوه کرښه",
  "J13": "د اورګاډي پټلۍ؛ دوه یا ډېرې کرښې",
  "J14": "د ټرام تقاطع",
  "J15": "خوځنده پل",
  "J16": "د سړک کارونه روان دي",
  "J17": "سړک تنګېږي",
  "J18": "سړک له ښي لوري تنګېږي",
  "J19": "سړک له چپ لوري تنګېږي",
  "J20": "د ښوېدو خطر",
  "J21": "ماشومان",
  "J22": "د پیاده کسانو د اوښتو ځای",
  "J23": "پیاده کسان",
  "J24": "بایسکل او موپېډ چلوونکي",
  "J25": "پر سړک پراته کاڼي",
  "J26": "د سیند غاړه یا بندر",
  "J27": "لوی وحشي ژوي",
  "J28": "څاروي",
  "J29": "له مقابل لوري ترافیک",
  "J30": "په ټیټه ارتفاع الوتکې",
  "J31": "اړخیز باد",
  "J32": "ترافیکي څراغونه",
  "J33": "ترافیکي ګڼه ګوڼه",
  "J34": "ترافیکي پېښه",
  "J35": "د واورې، باران یا لوخړې له امله کم لید",
  "J36": "کنګل یا واوره",
  "J37": "نور خطر",
  "J38": "د سرعت کمولو برجستګي",
  "J39": "خوځنده ستن",
  "K1": "د موټروې د لارې پرېکړه کوونکې نښه",
  "K2.1": "د موټروې مخکینۍ لارښوونکې نښه"
};
  const categoryNames = {
    priority: 'د لومړیتوب نښه',
    prohibition: 'منع کوونکې نښه',
    mandatory: 'اجباري نښه',
    warning: 'د خبرداري نښه',
    information: 'معلوماتي نښه'
  };
  const describe = (title, category) => {
    if (category === 'warning') return `دا نښه د «${title}» په اړه خبرداری ورکوي. سرعت کم کړئ او د سړک حالت ته چمتو اوسئ.`;
    if (category === 'mandatory') return `دا نښه وايي: «${title}». د نښې لارښوونه اجباري ده او باید تعقیب شي.`;
    if (category === 'priority') return `دا نښه د لومړیتوب قانون ښيي: «${title}». څلورلارې او نور چلوونکي په دقت وڅارئ.`;
    if (category === 'prohibition') return `دا نښه د ترافیکي منع یا محدودیت معنا لري: «${title}». د نښې حکم له همدې ځایه عملي کېږي.`;
    return `دا معلوماتي نښه «${title}» ښيي. د مسیر او سړک د تنظیم لپاره یې لارښوونه تعقیب کړئ.`;
  };
  const categories = Object.fromEntries((window.MT_SIGNS_PART1 || []).map((sign) => [String(sign[0]), sign[1]]));
  window.MT_SIGN_PASHTO = Object.freeze(Object.fromEntries(
    Object.entries(titles).map(([code, title]) => [code, Object.freeze({
      title,
      category: categoryNames[categories[code]] || 'ترافیکي نښه',
      description: describe(title, categories[code])
    })])
  ));
})();
/* PASHTO_SIGN_TRANSLATIONS_END */
