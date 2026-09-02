-- Expand the bilingual exam bank from 50 to 100 reviewed text questions.
-- Every exam receives a deterministic, exam-specific selection of 50 questions.

BEGIN;

WITH data (
  external_key, prompt_nl, prompt_fa,
  option_1_nl, option_1_fa, option_2_nl, option_2_fa, option_3_nl, option_3_fa,
  correct_option, category, explanation_nl, explanation_fa
) AS (
  VALUES
    ('cbr2025-q51', 'Waar rijden bestuurders in Nederland in beginsel?', 'رانندگان در هالند اصولاً در کدام سمت حرکت می‌کنند؟', 'Zoveel mogelijk rechts', 'تا حد ممکن سمت راست', 'Altijd midden op de rijbaan', 'همیشه وسط جاده', 'Zoveel mogelijk links', 'تا حد ممکن سمت چپ', 0, 'road-position', 'Bestuurders zijn verplicht zoveel mogelijk rechts te houden.', 'رانندگان موظف‌اند تا حد ممکن سمت راست حرکت کنند.'),
    ('cbr2025-q52', 'Aan welke kant haal je een ander voertuig normaal in?', 'معمولاً از کدام سمت از وسیله دیگر سبقت می‌گیرید؟', 'Links', 'سمت چپ', 'Rechts', 'سمت راست', 'Via de berm', 'از شانه راه', 0, 'overtaking', 'Inhalen gebeurt in beginsel links.', 'سبقت گرفتن اصولاً از سمت چپ انجام می‌شود.'),
    ('cbr2025-q53', 'Mag je een kruispunt oprijden als je het door drukte niet kunt vrijmaken?', 'اگر به علت شلوغی نتوانید تقاطع را خالی کنید، آیا می‌توانید وارد آن شوید؟', 'Ja, als het licht groen is', 'بله، اگر چراغ سبز باشد', 'Nee', 'خیر', 'Alleen met alarmlichten', 'فقط با چراغ خطر', 1, 'intersection', 'Je mag een kruispunt niet blokkeren, ook niet bij groen licht.', 'حتی با چراغ سبز نباید تقاطع را مسدود کنید.'),
    ('cbr2025-q54', 'Wie gaat op een gelijkwaardig kruispunt voor?', 'در تقاطع هم‌ارزش چه کسی حق تقدم دارد؟', 'Bestuurders van rechts', 'رانندگان از سمت راست', 'Bestuurders van links', 'رانندگان از سمت چپ', 'De snelste bestuurder', 'راننده سریع‌تر', 0, 'priority', 'Op een gelijkwaardig kruispunt verleen je voorrang aan bestuurders van rechts.', 'در تقاطع هم‌ارزش باید به رانندگان از سمت راست حق تقدم بدهید.'),
    ('cbr2025-q55', 'Je komt vanaf een onverharde weg op een verharde weg. Wie gaat voor?', 'از راه خاکی وارد راه آسفالت می‌شوید. چه کسی حق تقدم دارد؟', 'Verkeer op de verharde weg', 'ترافیک روی راه آسفالت', 'Verkeer van de onverharde weg', 'ترافیک راه خاکی', 'Degene die rechtdoor rijdt', 'کسی که مستقیم می‌رود', 0, 'priority', 'Bestuurders op een onverharde weg verlenen voorrang aan bestuurders op de verharde weg.', 'رانندگان راه خاکی باید به رانندگان راه آسفالت حق تقدم بدهند.'),
    ('cbr2025-q56', 'Een tram en een auto naderen een gelijkwaardig kruispunt. Wie gaat in beginsel voor?', 'ترام و موتر به تقاطع هم‌ارزش نزدیک می‌شوند. اصولاً چه کسی حق تقدم دارد؟', 'De auto', 'موتر', 'De tram', 'ترام', 'Degene van rechts', 'کسی که از راست می‌آید', 1, 'priority', 'Bestuurders verlenen op een gelijkwaardig kruispunt voorrang aan een tram.', 'در تقاطع هم‌ارزش رانندگان باید به ترام حق تقدم بدهند.'),
    ('cbr2025-q57', 'Je slaat af. Wie moet je op dezelfde weg voor laten gaan?', 'می‌پیچید. به چه کسی در همان راه باید حق تقدم بدهید؟', 'Alleen motorvoertuigen', 'فقط وسایل موتوری', 'Verkeer dat rechtdoor gaat', 'ترافیکی که مستقیم می‌رود', 'Niemand als je richting aangeeft', 'اگر راهنما بزنید به هیچ‌کس', 1, 'turning', 'Afslaand verkeer laat verkeer dat op dezelfde weg rechtdoor gaat voor.', 'وسیله‌ای که می‌پیچد باید به ترافیک مستقیم در همان راه حق تقدم بدهد.'),
    ('cbr2025-q58', 'Twee tegemoetkomende bestuurders slaan dezelfde zijweg in. Wie gaat voor?', 'دو راننده روبه‌رو می‌خواهند وارد یک راه فرعی شوند. چه کسی اول می‌رود؟', 'De linksafslaande bestuurder', 'راننده‌ای که به چپ می‌پیچد', 'De rechtsafslaande bestuurder', 'راننده‌ای که به راست می‌پیچد', 'Altijd het grootste voertuig', 'همیشه وسیله بزرگ‌تر', 1, 'turning', 'De bestuurder die links afslaat laat de tegemoetkomende rechtsafslaande bestuurder voor.', 'راننده‌ای که به چپ می‌پیچد باید به راننده روبه‌رو که به راست می‌پیچد راه بدهد.'),
    ('cbr2025-q59', 'Hoe kies je een veilige snelheid?', 'چگونه سرعت ایمن را انتخاب می‌کنید؟', 'Zodat je binnen de overzienbare vrije afstand kunt stoppen', 'به‌گونه‌ای که در فاصله آزاد و قابل دید توقف کنید', 'Altijd precies de maximumsnelheid', 'همیشه دقیقاً سرعت مجاز', 'Zo snel als het overige verkeer', 'به سرعت ترافیک دیگر', 0, 'speed', 'Je moet je voertuig tot stilstand kunnen brengen binnen de afstand die je kunt overzien en die vrij is.', 'باید بتوانید در فاصله‌ای که می‌بینید و آزاد است وسیله را متوقف کنید.'),
    ('cbr2025-q60', 'Wat is voor een personenauto meestal de maximumsnelheid binnen de bebouwde kom als borden niets anders aangeven?', 'اگر تابلو چیز دیگری نگوید، حداکثر سرعت معمول موتر سواری داخل شهر چقدر است؟', '30 km/u', '۳۰ کیلومتر در ساعت', '50 km/u', '۵۰ کیلومتر در ساعت', '70 km/u', '۷۰ کیلومتر در ساعت', 1, 'speed', 'Binnen de bebouwde kom geldt voor motorvoertuigen meestal 50 km/u, tenzij anders aangegeven.', 'داخل محدوده شهری معمولاً ۵۰ کیلومتر در ساعت مجاز است، مگر اینکه خلاف آن اعلام شود.'),
    ('cbr2025-q61', 'Wat is voor een personenauto meestal de maximumsnelheid buiten de bebouwde kom op een gewone weg?', 'حداکثر سرعت معمول موتر سواری بیرون شهر در راه عادی چقدر است؟', '60 km/u', '۶۰ کیلومتر در ساعت', '80 km/u', '۸۰ کیلومتر در ساعت', '100 km/u', '۱۰۰ کیلومتر در ساعت', 1, 'speed', 'Op gewone wegen buiten de bebouwde kom geldt meestal 80 km/u, tenzij anders aangegeven.', 'در راه‌های عادی بیرون شهر معمولاً ۸۰ کیلومتر در ساعت مجاز است، مگر اینکه خلاف آن اعلام شود.'),
    ('cbr2025-q62', 'Welke algemene maximumsnelheid geldt overdag van 06.00 tot 19.00 uur op Nederlandse autosnelwegen, tenzij borden anders aangeven?', 'در بزرگراه‌های هالند از ساعت ۶ تا ۱۹، مگر تابلو خلاف آن را بگوید، حداکثر سرعت عمومی چقدر است؟', '100 km/u', '۱۰۰ کیلومتر در ساعت', '120 km/u', '۱۲۰ کیلومتر در ساعت', '130 km/u', '۱۳۰ کیلومتر در ساعت', 0, 'speed', 'Overdag geldt op autosnelwegen een algemene limiet van 100 km/u; borden kunnen een andere limiet aangeven.', 'در روز حد عمومی بزرگراه ۱۰۰ کیلومتر در ساعت است؛ تابلو می‌تواند سرعت دیگری تعیین کند.'),
    ('cbr2025-q63', 'Wat is voor een personenauto de algemene maximumsnelheid op een autoweg buiten de bebouwde kom?', 'حداکثر سرعت عمومی موتر سواری در اتوراه بیرون شهر چقدر است؟', '80 km/u', '۸۰ کیلومتر در ساعت', '100 km/u', '۱۰۰ کیلومتر در ساعت', '130 km/u', '۱۳۰ کیلومتر در ساعت', 1, 'speed', 'Op een autoweg buiten de bebouwde kom geldt voor een personenauto maximaal 100 km/u, tenzij anders aangegeven.', 'در اتوراه بیرون شهر حداکثر سرعت موتر سواری ۱۰۰ کیلومتر در ساعت است، مگر خلاف آن اعلام شود.'),
    ('cbr2025-q64', 'Hoe hard mag een personenauto met een aanhangwagen tot en met 3.500 kg maximaal rijden op een autosnelweg?', 'موتر سواری با تریلر تا وزن ۳۵۰۰ کیلوگرم در بزرگراه حداکثر با چه سرعتی می‌تواند برود؟', '80 km/u', '۸۰ کیلومتر در ساعت', '90 km/u', '۹۰ کیلومتر در ساعت', '100 km/u', '۱۰۰ کیلومتر در ساعت', 1, 'trailer', 'Voor een personenauto met aanhangwagen tot en met 3.500 kg geldt maximaal 90 km/u.', 'برای موتر سواری با تریلر تا ۳۵۰۰ کیلوگرم حداکثر سرعت ۹۰ کیلومتر در ساعت است.'),
    ('cbr2025-q65', 'Mag je stilstaan op een zebrapad of binnen vijf meter daarvan?', 'آیا می‌توانید روی خط عابر یا تا پنج متر از آن توقف کنید؟', 'Ja, met alarmlichten', 'بله، با چراغ خطر', 'Nee', 'خیر', 'Alleen buiten de spits', 'فقط بیرون ساعت شلوغی', 1, 'stopping', 'Stilstaan op een voetgangersoversteekplaats of binnen vijf meter daarvan is verboden.', 'توقف روی گذرگاه عابر یا تا پنج متر از آن ممنوع است.'),
    ('cbr2025-q66', 'Mag je stilstaan bij een bushalte om direct passagiers te laten in- of uitstappen?', 'آیا می‌توانید کنار ایستگاه بس برای سوار یا پیاده کردن فوری مسافر توقف کنید؟', 'Ja, als je de bus niet hindert', 'بله، اگر مزاحم بس نشوید', 'Nooit', 'هرگز', 'Alleen met motor uit', 'فقط با موتور خاموش', 0, 'stopping', 'Bij een bushalte mag kort worden gestopt voor onmiddellijk in- of uitstappen, zolang je het openbaar vervoer niet hindert.', 'کنار ایستگاه بس می‌توان برای سوار یا پیاده شدن فوری توقف کوتاه کرد، اگر مزاحم حمل‌ونقل عمومی نشوید.'),
    ('cbr2025-q67', 'Hoeveel meter afstand moet je bij parkeren minstens tot een kruispunt houden?', 'هنگام پارک حداقل چند متر باید از تقاطع فاصله داشته باشید؟', '2 meter', '۲ متر', '5 meter', '۵ متر', '12 meter', '۱۲ متر', 1, 'parking', 'Parkeren binnen vijf meter van een kruispunt is verboden.', 'پارک در فاصله کمتر از پنج متر از تقاطع ممنوع است.'),
    ('cbr2025-q68', 'Mag je voor een inrit of uitrit parkeren?', 'آیا می‌توانید جلوی ورودی یا خروجی پارک کنید؟', 'Ja, maximaal vijf minuten', 'بله، حداکثر پنج دقیقه', 'Nee', 'خیر', 'Alleen als het jouw eigen inrit is', 'فقط اگر ورودی خودتان باشد', 1, 'parking', 'Parkeren voor een inrit of uitrit is verboden.', 'پارک کردن جلوی ورودی یا خروجی ممنوع است.'),
    ('cbr2025-q69', 'Mag je naast een geparkeerde auto dubbel parkeren?', 'آیا می‌توانید کنار موتر پارک‌شده به‌صورت دوبله پارک کنید؟', 'Ja, met alarmlichten', 'بله، با چراغ خطر', 'Nee', 'خیر', 'Alleen overdag', 'فقط روزها', 1, 'parking', 'Dubbel parkeren belemmert het verkeer en is verboden.', 'پارک دوبله مانع ترافیک می‌شود و ممنوع است.'),
    ('cbr2025-q70', 'Mag je buiten de bebouwde kom op de rijbaan van een voorrangsweg parkeren?', 'آیا بیرون شهر می‌توانید روی بخش حرکت راه دارای اولویت پارک کنید؟', 'Ja, als je rechts staat', 'بله، اگر سمت راست باشید', 'Nee', 'خیر', 'Alleen in het donker', 'فقط شب', 1, 'parking', 'Buiten de bebouwde kom mag je niet op de rijbaan van een voorrangsweg parkeren.', 'بیرون شهر پارک روی بخش حرکت راه دارای اولویت ممنوع است.'),
    ('cbr2025-q71', 'Geeft richting aangeven je voorrang bij het wisselen van rijstrook?', 'آیا راهنما زدن هنگام تغییر خط به شما حق تقدم می‌دهد؟', 'Ja', 'بله', 'Nee', 'خیر', 'Alleen op de snelweg', 'فقط در بزرگراه', 1, 'manoeuvre', 'Richting aangeven kondigt je bedoeling aan, maar geeft geen voorrang.', 'راهنما فقط قصد شما را نشان می‌دهد و حق تقدم ایجاد نمی‌کند.'),
    ('cbr2025-q72', 'Wie moet voorrang verlenen bij invoegen vanaf een invoegstrook?', 'هنگام ادغام از خط ورودی چه کسی باید راه بدهد؟', 'Het verkeer op de doorgaande rijbaan', 'ترافیک خط اصلی', 'De invoegende bestuurder', 'راننده‌ای که وارد می‌شود', 'Degene met de hoogste snelheid', 'کسی که سریع‌تر است', 1, 'merge', 'Invoegen is een bijzondere manoeuvre; de invoegende bestuurder laat het overige verkeer voorgaan.', 'ادغام مانور ویژه است؛ راننده واردشونده باید به دیگران راه بدهد.'),
    ('cbr2025-q73', 'Je rijdt achteruit. Wie moet je voor laten gaan?', 'در حال دنده‌عقب هستید. به چه کسی باید راه بدهید؟', 'Alleen voetgangers', 'فقط عابران', 'Al het overige verkeer', 'تمام ترافیک دیگر', 'Alleen verkeer van rechts', 'فقط ترافیک از راست', 1, 'manoeuvre', 'Achteruitrijden is een bijzondere manoeuvre; je laat al het overige verkeer voorgaan.', 'دنده‌عقب مانور ویژه است و باید به تمام ترافیک دیگر راه بدهید.'),
    ('cbr2025-q74', 'Je rijdt weg uit een parkeervak. Wie gaat voor?', 'از جای پارک حرکت می‌کنید. چه کسی حق تقدم دارد؟', 'Jij als je richting aangeeft', 'شما اگر راهنما بزنید', 'Al het overige verkeer', 'تمام ترافیک دیگر', 'Alleen verkeer van links', 'فقط ترافیک از چپ', 1, 'manoeuvre', 'Wegrijden is een bijzondere manoeuvre; al het overige verkeer gaat voor.', 'حرکت از جای پارک مانور ویژه است؛ تمام ترافیک دیگر حق تقدم دارد.'),
    ('cbr2025-q75', 'Wanneer mag je een portier openen?', 'چه زمانی می‌توانید در موتر را باز کنید؟', 'Altijd als je stilstaat', 'همیشه وقتی توقف کرده‌اید', 'Alleen als daardoor geen gevaar of hinder ontstaat', 'فقط وقتی خطر یا مزاحمت ایجاد نشود', 'Alleen aan de bestuurderskant', 'فقط سمت راننده', 1, 'safety', 'Je mag een portier niet openen als daardoor gevaar of hinder kan ontstaan.', 'اگر باز کردن در خطر یا مزاحمت ایجاد کند، مجاز نیست.'),
    ('cbr2025-q76', 'Mag je onnodig geluid veroorzaken met claxon of motor?', 'آیا می‌توانید با بوق یا موتور صدای غیرضروری ایجاد کنید؟', 'Ja, overdag', 'بله، روزها', 'Nee', 'خیر', 'Alleen buiten de bebouwde kom', 'فقط بیرون شهر', 1, 'signals', 'Het veroorzaken van onnodig geluid is verboden.', 'ایجاد صدای غیرضروری ممنوع است.'),
    ('cbr2025-q77', 'Wanneer mag je de claxon gebruiken?', 'چه زمانی می‌توانید از بوق استفاده کنید؟', 'Om iemand te begroeten', 'برای سلام کردن', 'Om dreigend gevaar af te wenden', 'برای جلوگیری از خطر فوری', 'Om voorrang te vragen', 'برای درخواست حق تقدم', 1, 'signals', 'Geluidssignalen mogen alleen worden gegeven om dreigend gevaar af te wenden.', 'بوق فقط برای جلوگیری از خطر فوری مجاز است.'),
    ('cbr2025-q78', 'Wanneer mag je groot licht niet gebruiken?', 'چه زمانی نباید از نوربالا استفاده کنید؟', 'Als je andere weggebruikers verblindt', 'وقتی دیگران را خیره می‌کند', 'Op een onverlichte weg', 'در راه بدون روشنایی', 'Buiten de bebouwde kom', 'بیرون شهر', 0, 'light', 'Groot licht mag niet worden gebruikt als andere weggebruikers daardoor worden verblind.', 'نوربالا نباید باعث خیره شدن دیگر کاربران راه شود.'),
    ('cbr2025-q79', 'Wanneer mag je mistlicht aan de voorzijde gebruiken?', 'چه زمانی می‌توانید چراغ مه‌شکن جلو را روشن کنید؟', 'Als mist, sneeuwval of regen het zicht ernstig belemmert', 'وقتی مه، برف یا باران دید را شدیداً کم می‌کند', 'Bij iedere regenbui', 'در هر بارندگی', 'Alleen bij minder dan 50 meter zicht', 'فقط وقتی دید کمتر از ۵۰ متر است', 0, 'light', 'Mistlicht vóór mag worden gebruikt wanneer mist, sneeuwval of regen het zicht ernstig belemmert.', 'چراغ مه‌شکن جلو زمانی مجاز است که مه، برف یا باران دید را شدیداً کاهش دهد.'),
    ('cbr2025-q80', 'Branden bij dagrijverlichting altijd ook de achterlichten?', 'آیا با چراغ روز همیشه چراغ‌های عقب نیز روشن‌اند؟', 'Ja, altijd', 'بله، همیشه', 'Nee, niet bij iedere auto', 'خیر، در همه موترها نه', 'Alleen bij stilstand', 'فقط هنگام توقف', 1, 'light', 'Bij dagrijverlichting branden de achterlichten niet bij iedere auto; controleer bij slecht zicht dat dimlicht aanstaat.', 'با چراغ روز، چراغ عقب در همه موترها روشن نیست؛ در دید کم چراغ پایین را روشن کنید.'),
    ('cbr2025-q81', 'Waar plaats je een gevarendriehoek als je voertuig een obstakel vormt?', 'اگر وسیله شما مانع ایجاد کرده، مثلث خطر را کجا می‌گذارید؟', 'Ongeveer 5 meter achter de auto', 'حدود ۵ متر پشت موتر', 'Ongeveer 30 meter in de richting van het naderende verkeer', 'حدود ۳۰ متر در جهت ترافیک نزدیک‌شونده', 'Op het dak', 'روی سقف', 1, 'emergency', 'Plaats de gevarendriehoek ongeveer 30 meter van het voertuig, zichtbaar voor verkeer waarvoor het voertuig gevaar oplevert.', 'مثلث خطر را حدود ۳۰ متر دورتر و در دید ترافیکی بگذارید که وسیله برای آن خطر ایجاد می‌کند.'),
    ('cbr2025-q82', 'Hoeveel personen mogen op één normale zitplaats zitten?', 'چند نفر می‌توانند روی یک چوکی عادی بنشینند؟', 'Eén persoon', 'یک نفر', 'Twee personen met één gordel', 'دو نفر با یک کمربند', 'Zoveel als er ruimte is', 'هرچند نفر که جا باشد', 0, 'seat', 'Een zitplaats is bestemd voor één persoon; gordels mogen niet worden gedeeld.', 'هر چوکی برای یک نفر است و کمربند نباید مشترک استفاده شود.'),
    ('cbr2025-q83', 'Wat is bepalend voor het gebruik van een kinderzitje in een personenauto?', 'چه چیزی برای استفاده از صندلی کودک در موتر سواری تعیین‌کننده است؟', 'Alleen de leeftijd', 'فقط سن', 'De lengte van het kind en de toepasselijke uitzonderingen', 'قد کودک و استثناهای مربوط', 'Alleen het gewicht van de auto', 'فقط وزن موتر', 1, 'children', 'Kinderen kleiner dan 1,35 meter gebruiken in beginsel een passend goedgekeurd kinderbeveiligingssysteem.', 'کودکان کوتاه‌تر از ۱٫۳۵ متر اصولاً باید از صندلی ایمنی مناسب و تأییدشده استفاده کنند.'),
    ('cbr2025-q84', 'Je staat met de auto stil in een file. Mag je een telefoon in de hand houden?', 'با موتر در ترافیک ایستاده‌اید. آیا می‌توانید تلفن را در دست بگیرید؟', 'Ja, zolang je daadwerkelijk stilstaat', 'بله، تا وقتی واقعاً توقف کرده‌اید', 'Nee, ook niet bij stilstand', 'خیر، حتی هنگام توقف', 'Alleen om een bericht te lezen', 'فقط برای خواندن پیام', 0, 'phone', 'Volgens de Rijksoverheid mag je een apparaat vasthouden als je stilstaat. Zodra je weer rijdt, mag dat niet.', 'طبق مقررات دولت، هنگام توقف می‌توانید وسیله را در دست بگیرید؛ به محض حرکت دوباره مجاز نیست.'),
    ('cbr2025-q85', 'Wanneer mag je de vluchtstrook gebruiken?', 'چه زمانی می‌توانید از شانه اضطراری استفاده کنید؟', 'Om een file voorbij te rijden', 'برای عبور از ترافیک', 'Bij een noodgeval of wanneer deze officieel als rijstrook is opengesteld', 'در وضعیت اضطراری یا وقتی رسماً به‌عنوان خط باز شده', 'Om te telefoneren', 'برای تلفن کردن', 1, 'motorway', 'De vluchtstrook is voor noodgevallen, behalve wanneer deze officieel als spitsstrook is geopend.', 'شانه اضطراری برای وضعیت اضطراری است، مگر وقتی رسماً به‌عنوان خط اوج ترافیک باز باشد.'),
    ('cbr2025-q86', 'Je krijgt pech op de autosnelweg. Waar wacht je als dat veilig kan?', 'در بزرگراه موتر خراب می‌شود. اگر ایمن باشد کجا منتظر می‌مانید؟', 'In de auto op de rijstrook', 'داخل موتر در خط حرکت', 'Achter de vangrail, zo ver mogelijk van het verkeer', 'پشت گاردریل و تا حد ممکن دور از ترافیک', 'Midden op de vluchtstrook', 'وسط شانه اضطراری', 1, 'emergency', 'Breng jezelf en inzittenden bij pech zo mogelijk achter de vangrail en uit de buurt van het verkeer.', 'در خرابی، خود و سرنشینان را در صورت امکان پشت گاردریل و دور از ترافیک ببرید.'),
    ('cbr2025-q87', 'Heeft verkeer op een rotonde altijd automatisch voorrang?', 'آیا ترافیک داخل میدان همیشه خودکار حق تقدم دارد؟', 'Ja', 'بله', 'Nee, borden en haaientanden bepalen de voorrang', 'خیر، تابلو و مثلث‌های روی راه تعیین می‌کنند', 'Alleen fietsers', 'فقط دوچرخه‌سواران', 1, 'roundabout', 'De voorrang bij een rotonde wordt bepaald door verkeerstekens; een rotonde geeft op zichzelf geen voorrang.', 'حق تقدم در میدان با علایم تعیین می‌شود و خود میدان به‌تنهایی حق تقدم ایجاد نمی‌کند.'),
    ('cbr2025-q88', 'Een bus geeft binnen de bebouwde kom richting aan om van een halte weg te rijden. Wat doe je?', 'داخل شهر بس برای خروج از ایستگاه راهنما می‌زند. چه می‌کنید؟', 'De bus gelegenheid geven weg te rijden', 'به بس فرصت حرکت می‌دهید', 'Snel links passeren', 'سریع از چپ عبور می‌کنید', 'Claxonneren zodat de bus wacht', 'بوق می‌زنید تا بس منتظر بماند', 0, 'bus', 'Binnen de bebouwde kom moet je een bus die richting aangeeft gelegenheid geven van de halte weg te rijden.', 'داخل شهر باید به بسی که راهنما زده فرصت بدهید از ایستگاه حرکت کند.'),
    ('cbr2025-q89', 'Mag je een uitvaartstoet van motorvoertuigen op een kruispunt doorsnijden?', 'آیا می‌توانید صف وسایل نقلیه مراسم جنازه را در تقاطع قطع کنید؟', 'Ja, als je groen licht hebt', 'بله، اگر چراغ سبز دارید', 'Nee, als de stoet de voorgeschreven herkenningstekens voert', 'خیر، اگر صف علایم ویژه مقرر را دارد', 'Alleen met een motorfiets', 'فقط با موتورسیکلت', 1, 'procession', 'Een herkenbare uitvaartstoet van motorvoertuigen mag op een kruispunt niet worden doorsneden.', 'صف شناخته‌شده وسایل مراسم جنازه را در تقاطع نباید قطع کرد.'),
    ('cbr2025-q90', 'Een blinde voetganger steekt over met een witte stok met rode ringen. Wat doe je?', 'عابر نابینا با عصای سفید دارای حلقه‌های سرخ عبور می‌کند. چه می‌کنید؟', 'Voorrang verlenen', 'حق تقدم می‌دهید', 'Alleen snelheid verminderen', 'فقط سرعت کم می‌کنید', 'Claxonneren', 'بوق می‌زنید', 0, 'pedestrian', 'Bestuurders moeten blinde voetgangers met de herkenbare stok voor laten gaan.', 'رانندگان باید به عابر نابینا با عصای شناخته‌شده حق تقدم بدهند.'),
    ('cbr2025-q91', 'Je slaat rechtsaf en een voetganger steekt de weg over die jij inrijdt. Wie gaat voor?', 'به راست می‌پیچید و عابر از راهی که واردش می‌شوید عبور می‌کند. چه کسی اول می‌رود؟', 'De voetganger', 'عابر', 'De auto', 'موتر', 'Degene die het eerst aankwam', 'کسی که زودتر رسیده', 0, 'turning', 'Afslaande bestuurders laten verkeer, waaronder voetgangers, dat dezelfde weg rechtdoor volgt voorgaan.', 'راننده‌ای که می‌پیچد باید به ترافیک مستقیم همان راه، از جمله عابر، راه بدهد.'),
    ('cbr2025-q92', 'Mag je een militaire colonne doorsnijden?', 'آیا می‌توانید صف نظامی را قطع کنید؟', 'Ja, buiten de bebouwde kom', 'بله، بیرون شهر', 'Nee', 'خیر', 'Alleen bij een rotonde', 'فقط در میدان', 1, 'procession', 'Weggebruikers mogen een militaire colonne niet doorsnijden.', 'کاربران راه نباید صف نظامی را قطع کنند.'),
    ('cbr2025-q93', 'Wanneer mag je een spoorwegovergang oprijden?', 'چه زمانی می‌توانید وارد گذرگاه راه‌آهن شوید؟', 'Als je deze volledig kunt vrijmaken', 'وقتی بتوانید آن را کاملاً خالی کنید', 'Zodra de auto voor je begint te rijden', 'همین که موتر جلویی حرکت کند', 'Altijd als de slagboom open is', 'همیشه وقتی مانع باز است', 0, 'railway', 'Je mag een overweg alleen oprijden als je die direct en volledig kunt vrijmaken.', 'فقط وقتی می‌توانید گذرگاه را فوری و کامل خالی کنید وارد آن شوید.'),
    ('cbr2025-q94', 'Wat betekent een rood verkeerslicht?', 'چراغ سرخ چه معنا دارد؟', 'Stoppen', 'توقف', 'Voorzichtig doorrijden', 'با احتیاط عبور کردن', 'Alleen voorrang verlenen', 'فقط حق تقدم دادن', 0, 'traffic-light', 'Rood licht betekent stoppen.', 'چراغ سرخ یعنی توقف.'),
    ('cbr2025-q95', 'Wat betekent geel verkeerslicht?', 'چراغ زرد چه معنا دارد؟', 'Altijd versnellen', 'همیشه سرعت گرفتن', 'Stoppen, tenzij dat redelijkerwijs niet meer veilig kan', 'توقف، مگر اینکه دیگر به‌طور ایمن ممکن نباشد', 'Hetzelfde als groen', 'همانند سبز', 1, 'traffic-light', 'Bij geel stop je, behalve wanneer je het licht redelijkerwijs niet meer veilig kunt stoppen.', 'در چراغ زرد توقف می‌کنید، مگر اینکه دیگر نتوانید به‌طور ایمن توقف کنید.'),
    ('cbr2025-q96', 'Het licht is groen, maar het kruispunt staat vast. Wat doe je?', 'چراغ سبز است اما تقاطع بسته است. چه می‌کنید؟', 'Het kruispunt oprijden', 'وارد تقاطع می‌شوید', 'Voor het kruispunt wachten', 'پیش از تقاطع منتظر می‌مانید', 'Claxonneren en doorrijden', 'بوق می‌زنید و عبور می‌کنید', 1, 'traffic-light', 'Ook bij groen mag je een kruispunt niet oprijden als je het niet kunt vrijmaken.', 'حتی با چراغ سبز، اگر نتوانید تقاطع را خالی کنید نباید وارد شوید.'),
    ('cbr2025-q97', 'Wat betekent een groene pijl in een verkeerslicht?', 'پیکان سبز در چراغ راهنمایی چه معنا دارد؟', 'Je mag alleen in de richting van de pijl rijden', 'فقط در جهت پیکان می‌توانید حرکت کنید', 'Alle richtingen zijn vrij', 'همه جهت‌ها آزادند', 'Je moet stoppen', 'باید توقف کنید', 0, 'traffic-light', 'Een groene pijl geeft doorgang in de richting van de pijl.', 'پیکان سبز اجازه حرکت در جهت همان پیکان را می‌دهد.'),
    ('cbr2025-q98', 'Waar stop je bij een rood licht met een stopstreep?', 'در چراغ سرخ با خط توقف کجا می‌ایستید؟', 'Na de stopstreep', 'بعد از خط توقف', 'Vóór de stopstreep', 'پیش از خط توقف', 'Midden op het kruispunt', 'وسط تقاطع', 1, 'road-marking', 'Bij rood stop je vóór de stopstreep.', 'در چراغ سرخ باید پیش از خط توقف بایستید.'),
    ('cbr2025-q99', 'Mag je een onderbroken streep overschrijden als dat veilig en toegestaan is?', 'آیا اگر ایمن و مجاز باشد می‌توانید از خط منقطع عبور کنید؟', 'Ja', 'بله', 'Nee, nooit', 'خیر، هرگز', 'Alleen met alarmlichten', 'فقط با چراغ خطر', 0, 'road-marking', 'Een onderbroken streep mag worden overschreden wanneer de manoeuvre veilig en verder toegestaan is.', 'اگر مانور ایمن و از نظر دیگر مجاز باشد می‌توان از خط منقطع عبور کرد.'),
    ('cbr2025-q100', 'Mag je een doorgetrokken streep tussen rijstroken normaal overschrijden?', 'آیا معمولاً می‌توانید از خط پیوسته میان خط‌های حرکت عبور کنید؟', 'Ja, om sneller in te halen', 'بله، برای سبقت سریع‌تر', 'Nee', 'خیر', 'Altijd als je richting aangeeft', 'همیشه اگر راهنما بزنید', 1, 'road-marking', 'Een doorgetrokken streep mag je in beginsel niet overschrijden.', 'اصولاً نباید از خط پیوسته عبور کنید.')
), release AS (
  SELECT id FROM content_releases WHERE version = 1
)
INSERT INTO exam_questions_v1 (
  release_id, external_key, prompt, options, explanation,
  correct_option, category, media, published
)
SELECT
  release.id,
  data.external_key,
  jsonb_build_object('nl', data.prompt_nl, 'fa', data.prompt_fa),
  jsonb_build_array(
    jsonb_build_object('nl', data.option_1_nl, 'fa', data.option_1_fa),
    jsonb_build_object('nl', data.option_2_nl, 'fa', data.option_2_fa),
    jsonb_build_object('nl', data.option_3_nl, 'fa', data.option_3_fa)
  ),
  jsonb_build_object('nl', data.explanation_nl, 'fa', data.explanation_fa),
  data.correct_option,
  data.category,
  '[]'::jsonb,
  TRUE
FROM data CROSS JOIN release
ON CONFLICT (release_id, external_key) DO UPDATE SET
  prompt = EXCLUDED.prompt,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  correct_option = EXCLUDED.correct_option,
  category = EXCLUDED.category,
  published = TRUE,
  updated_at = NOW();

DELETE FROM exam_definition_questions_v1 AS link
USING exam_definitions AS exam
WHERE link.exam_id = exam.id
  AND exam.release_id = (SELECT id FROM content_releases WHERE version = 1);

WITH selected AS (
  SELECT
    exam.id AS exam_id,
    question.id AS question_id,
    row_number() OVER (
      PARTITION BY exam.id
      ORDER BY md5(exam.exam_number::text || ':' || question.external_key)
    ) AS sort_order
  FROM exam_definitions AS exam
  JOIN exam_questions_v1 AS question ON question.release_id = exam.release_id AND question.published = TRUE
  WHERE exam.release_id = (SELECT id FROM content_releases WHERE version = 1)
), chosen AS (
  SELECT exam_id, question_id, sort_order
  FROM selected
  WHERE sort_order <= 50
)
INSERT INTO exam_definition_questions_v1 (exam_id, question_id, sort_order)
SELECT exam_id, question_id, sort_order::smallint FROM chosen;

UPDATE exam_definitions
SET question_count = 50,
    pass_score = 88,
    duration_seconds = 1800,
    updated_at = NOW()
WHERE release_id = (SELECT id FROM content_releases WHERE version = 1);

DO $check$
DECLARE
  bank_count integer;
  invalid_exams integer;
BEGIN
  SELECT count(*) INTO bank_count
  FROM exam_questions_v1
  WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND published = TRUE;

  SELECT count(*) INTO invalid_exams
  FROM (
    SELECT exam.id
    FROM exam_definitions AS exam
    LEFT JOIN exam_definition_questions_v1 AS link ON link.exam_id = exam.id
    WHERE exam.release_id = (SELECT id FROM content_releases WHERE version = 1)
    GROUP BY exam.id
    HAVING count(link.question_id) <> 50 OR count(DISTINCT link.question_id) <> 50
  ) AS invalid;

  IF bank_count < 100 OR invalid_exams <> 0 THEN
    RAISE EXCEPTION 'Exam bank validation failed: bank=%, invalid_exams=%', bank_count, invalid_exams;
  END IF;
END
$check$;

INSERT INTO schema_migrations (version, name)
VALUES (7, 'expand_exam_bank_to_100')
ON CONFLICT (version) DO NOTHING;

COMMIT;

