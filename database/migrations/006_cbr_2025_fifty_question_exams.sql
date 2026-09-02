-- Align every practice exam with the CBR B format introduced on 2025-04-07:
-- 50 scored questions, 44 correct to pass (88%), 30 minutes.
-- Adds twenty unique bilingual questions so an exam never repeats a question.

BEGIN;

WITH data (
  seq, external_key, prompt_nl, prompt_fa,
  option_1_nl, option_1_fa, option_2_nl, option_2_fa, option_3_nl, option_3_fa,
  correct_option, category, explanation_nl, explanation_fa
) AS (
  VALUES
    (31, 'cbr2025-q31', 'Wat is de wettelijke minimale profieldiepte van een personenautoband?', 'حداقل عمق قانونی آج تایر موتر سواری چقدر است؟',
      '1,0 mm', '۱٫۰ میلی‌متر', '1,6 mm', '۱٫۶ میلی‌متر', '2,5 mm', '۲٫۵ میلی‌متر', 1, 'tyre',
      'De wettelijke minimale profieldiepte voor personenautobanden is 1,6 mm.', 'حداقل عمق قانونی آج تایر موتر سواری ۱٫۶ میلی‌متر است.'),
    (32, 'cbr2025-q32', 'Wanneer moet je dimlicht gebruiken?', 'چه زمانی باید از چراغ پایین استفاده کنید؟',
      'Alleen in tunnels', 'فقط در تونل', 'In het donker en bij slecht zicht', 'در تاریکی و دید کم', 'Alleen buiten de bebouwde kom', 'فقط بیرون از محدوده شهری', 1, 'light',
      'Dimlicht is verplicht in het donker en overdag wanneer het zicht ernstig wordt belemmerd.', 'چراغ پایین در تاریکی و هنگامی که دید در روز بسیار کم است الزامی است.'),
    (33, 'cbr2025-q33', 'Hoe vervoer je in Nederland een kind kleiner dan 1,35 meter?', 'در هالند کودک کوتاه‌تر از ۱٫۳۵ متر را چگونه جابه‌جا می‌کنید؟',
      'Altijd alleen met de gewone gordel', 'همیشه فقط با کمربند عادی', 'In een passend goedgekeurd kinderbeveiligingssysteem', 'در صندلی ایمنی مناسب و تأییدشده کودک', 'Alleen op de achterbank zonder gordel', 'فقط روی چوکی عقب بدون کمربند', 1, 'children',
      'Een kind kleiner dan 1,35 meter hoort in een passend en goedgekeurd kinderbeveiligingssysteem.', 'کودک کوتاه‌تر از ۱٫۳۵ متر باید در صندلی ایمنی مناسب و تأییدشده کودک بنشیند.'),
    (34, 'cbr2025-q34', 'Wat betekent een rond blauw bord met een witte pijl?', 'تابلوی گرد آبی با پیکان سفید چه معنا دارد؟',
      'Een verplichte rijrichting', 'جهت حرکت اجباری', 'Een aanbevolen rijrichting', 'جهت حرکت پیشنهادی', 'Een inhaalverbod', 'ممنوعیت سبقت', 0, 'sign',
      'Een rond blauw bord geeft een gebod aan; de witte pijl toont de verplichte rijrichting.', 'تابلوی گرد آبی یک دستور را نشان می‌دهد و پیکان سفید جهت حرکت اجباری را مشخص می‌کند.'),
    (35, 'cbr2025-q35', 'Je rijdt vanuit een uitrit de weg op. Wie moet je voor laten gaan?', 'از یک خروجی وارد جاده می‌شوید. باید به چه کسانی راه بدهید؟',
      'Alleen bestuurders van links', 'فقط رانندگان از چپ', 'Alleen gemotoriseerd verkeer', 'فقط وسایل نقلیه موتوری', 'Al het overige verkeer', 'تمام کاربران دیگر راه', 2, 'priority',
      'Uit een uitrit wegrijden is een bijzondere manoeuvre; je laat al het overige verkeer voorgaan.', 'بیرون آمدن از خروجی مانور ویژه است؛ باید به تمام کاربران دیگر راه حق تقدم بدهید.'),
    (36, 'cbr2025-q36', 'Je wilt van rijstrook wisselen. Wie heeft voorrang?', 'می‌خواهید خط حرکت را عوض کنید. چه کسی حق تقدم دارد؟',
      'Jij, als je richting aangeeft', 'شما، اگر راهنما بزنید', 'Het verkeer dat al op de andere rijstrook rijdt', 'ترافیکی که از قبل در خط دیگر حرکت می‌کند', 'Degene die het snelst rijdt', 'کسی که سریع‌تر می‌راند', 1, 'merge',
      'Van rijstrook wisselen is een bijzondere manoeuvre; richting aangeven geeft geen voorrang.', 'تغییر خط مانور ویژه است؛ زدن راهنما به شما حق تقدم نمی‌دهد.'),
    (37, 'cbr2025-q37', 'Hoe dicht bij een kruispunt mag je niet parkeren?', 'تا چه فاصله‌ای از تقاطع پارک کردن ممنوع است؟',
      'Binnen 2 meter', 'در فاصله کمتر از ۲ متر', 'Binnen 5 meter', 'در فاصله کمتر از ۵ متر', 'Binnen 10 meter', 'در فاصله کمتر از ۱۰ متر', 1, 'parking',
      'Parkeren is verboden binnen vijf meter van een kruispunt.', 'پارک کردن در فاصله کمتر از پنج متر از تقاطع ممنوع است.'),
    (38, 'cbr2025-q38', 'Wanneer mag je het mistachterlicht gebruiken?', 'چه زمانی می‌توانید چراغ مه‌شکن عقب را روشن کنید؟',
      'Bij minder dan 50 meter zicht door mist of sneeuw', 'وقتی دید به علت مه یا برف کمتر از ۵۰ متر است', 'Bij iedere regenbui', 'در هر بارندگی', 'Altijd in het donker', 'همیشه در تاریکی', 0, 'mist',
      'Het mistachterlicht mag alleen bij minder dan 50 meter zicht door mist of sneeuw worden gebruikt, niet bij regen.', 'چراغ مه‌شکن عقب فقط وقتی دید به علت مه یا برف کمتر از ۵۰ متر باشد مجاز است، نه هنگام باران.'),
    (39, 'cbr2025-q39', 'Wat is de alcohollimiet voor een beginnende bestuurder?', 'حد مجاز الکل برای راننده تازه‌کار چقدر است؟',
      '0,2 promille', '۰٫۲ پرومیل', '0,5 promille', '۰٫۵ پرومیل', '0,8 promille', '۰٫۸ پرومیل', 0, 'alcohol',
      'Voor beginnende bestuurders geldt een alcohollimiet van 0,2 promille.', 'برای رانندگان تازه‌کار حد مجاز الکل ۰٫۲ پرومیل است.'),
    (40, 'cbr2025-q40', 'Mag je tijdens het rijden een telefoon in je hand houden?', 'آیا هنگام رانندگی می‌توانید تلفن را در دست بگیرید؟',
      'Ja, bij langzaam verkeer', 'بله، در ترافیک آهسته', 'Ja, als je niet belt', 'بله، اگر تماس نگیرید', 'Nee', 'خیر', 2, 'phone',
      'Tijdens het rijden mag je geen mobiel elektronisch apparaat in de hand houden.', 'هنگام رانندگی نباید وسیله الکترونیکی همراه را در دست بگیرید.'),
    (41, 'cbr2025-q41', 'Wat betekent een geel knipperend verkeerslicht?', 'چراغ زرد چشمک‌زن چه معنا دارد؟',
      'Je hebt altijd voorrang', 'شما همیشه حق تقدم دارید', 'Extra voorzichtig zijn en borden en voorrangsregels volgen', 'با احتیاط بیشتر حرکت کنید و تابلوها و قواعد حق تقدم را رعایت کنید', 'De weg is afgesloten', 'جاده بسته است', 1, 'intersection',
      'Geel knipperlicht waarschuwt voor gevaar; volg de aanwezige borden en normale voorrangsregels.', 'چراغ زرد چشمک‌زن هشدار خطر است؛ تابلوها و قواعد عادی حق تقدم را رعایت کنید.'),
    (42, 'cbr2025-q42', 'Een ambulance nadert met blauw zwaailicht en sirene. Wat doe je?', 'آمبولانس با چراغ آبی و آژیر نزدیک می‌شود. چه می‌کنید؟',
      'Veilig vrije doorgang geven', 'با ایمنی راه را باز می‌کنید', 'Direct midden op de weg stoppen', 'فوراً وسط جاده توقف می‌کنید', 'Sneller gaan rijden', 'سریع‌تر می‌رانید', 0, 'ambulance',
      'Een voorrangsvoertuig met blauw licht en sirene moet veilig vrije doorgang krijgen.', 'به وسیله امدادی با چراغ آبی و آژیر باید با ایمنی راه آزاد بدهید.'),
    (43, 'cbr2025-q43', 'Wanneer moet je stoppen voor een voetgangersoversteekplaats?', 'چه زمانی باید پیش از خط عابر پیاده توقف کنید؟',
      'Alleen als een verkeersregelaar dat zegt', 'فقط وقتی مأمور راهنمایی بگوید', 'Voor voetgangers die oversteken of duidelijk willen oversteken', 'برای عابرانی که در حال عبورند یا آشکارا می‌خواهند عبور کنند', 'Nooit als je 30 km/u rijdt', 'هرگز وقتی با سرعت ۳۰ می‌رانید', 1, 'zebra',
      'Je moet voetgangers die oversteken of duidelijk op het punt staan over te steken voor laten gaan.', 'باید به عابرانی که در حال عبورند یا آشکارا قصد عبور دارند راه بدهید.'),
    (44, 'cbr2025-q44', 'Welke motorvoertuigen mogen een autosnelweg gebruiken?', 'کدام وسایل نقلیه موتوری می‌توانند وارد بزرگراه شوند؟',
      'Voertuigen die minstens 60 km/u mogen en kunnen rijden', 'وسایلی که مجاز و قادر به حرکت با حداقل ۶۰ کیلومتر در ساعت‌اند', 'Alle motorvoertuigen zonder uitzondering', 'همه وسایل موتوری بدون استثنا', 'Alleen personenauto’s', 'فقط موترهای سواری', 0, 'speed',
      'Op een autosnelweg mogen alleen motorvoertuigen die minstens 60 km/u mogen en kunnen rijden.', 'فقط وسایل موتوری که مجاز و قادر به حرکت با حداقل ۶۰ کیلومتر در ساعت‌اند می‌توانند وارد بزرگراه شوند.'),
    (45, 'cbr2025-q45', 'Wat geeft een rond verkeersbord met een rode rand meestal aan?', 'تابلوی گرد با حاشیه سرخ معمولاً چه چیزی را نشان می‌دهد؟',
      'Een verbod of beperking', 'ممنوعیت یا محدودیت', 'Een parkeerplaats', 'محل پارک', 'Een aanbevolen route', 'مسیر پیشنهادی', 0, 'sign',
      'Ronde borden met een rode rand geven meestal een verbod of beperking aan.', 'تابلوهای گرد با حاشیه سرخ معمولاً ممنوعیت یا محدودیت را نشان می‌دهند.'),
    (46, 'cbr2025-q46', 'Wie moet in een auto de veiligheidsgordel gebruiken?', 'چه کسانی در موتر باید کمربند ایمنی ببندند؟',
      'Alleen de bestuurder', 'فقط راننده', 'Iedereen op een zitplaats met een gordel', 'همه کسانی که روی چوکی دارای کمربند نشسته‌اند', 'Alleen passagiers voorin', 'فقط سرنشینان جلو', 1, 'seatbelt',
      'Iedereen gebruikt de beschikbare veiligheidsgordel; voor kinderen gelden aanvullende regels.', 'همه باید از کمربند موجود استفاده کنند؛ برای کودکان قواعد اضافی وجود دارد.'),
    (47, 'cbr2025-q47', 'Hoe moet lading in een auto worden vervoerd?', 'بار در موتر چگونه باید حمل شود؟',
      'Zo dat deze niet kan verschuiven of gevaar veroorzaken', 'به‌گونه‌ای که جابه‌جا نشود یا خطر ایجاد نکند', 'Los, zolang de achterklep dicht is', 'آزاد، تا وقتی صندوق بسته است', 'Alleen op de passagiersstoel', 'فقط روی چوکی سرنشین', 0, 'load',
      'Lading moet deugdelijk zijn vastgezet en mag zicht, bediening of veiligheid niet hinderen.', 'بار باید محکم بسته شود و نباید دید، کنترل یا ایمنی را مختل کند.'),
    (48, 'cbr2025-q48', 'Welke verzekering is minimaal verplicht voor een personenauto?', 'حداقل کدام بیمه برای موتر سواری الزامی است؟',
      'WA-verzekering', 'بیمه مسئولیت مدنی', 'Rechtsbijstandverzekering', 'بیمه کمک حقوقی', 'Inzittendenverzekering', 'بیمه سرنشینان', 0, 'documents',
      'Voor een motorrijtuig is minimaal een wettelijke aansprakelijkheidsverzekering verplicht.', 'برای وسیله نقلیه موتوری حداقل بیمه مسئولیت مدنی قانونی الزامی است.'),
    (49, 'cbr2025-q49', 'Wat moet je doen wanneer je parkeert in een parkeerschijfzone?', 'هنگام پارک در منطقه دیسک پارک چه باید بکنید؟',
      'De parkeerschijf instellen en de aangegeven maximale tijd volgen', 'دیسک پارک را تنظیم و حداکثر زمان اعلام‌شده را رعایت کنید', 'De alarmlichten aanzetten', 'چراغ خطر را روشن کنید', 'Altijd een parkeerkaart kopen', 'همیشه کارت پارک بخرید', 0, 'parking',
      'In een parkeerschijfzone stel je de schijf correct in en houd je je aan de aangegeven parkeerduur.', 'در منطقه دیسک پارک باید دیسک را درست تنظیم و مدت مجاز پارک را رعایت کنید.'),
    (50, 'cbr2025-q50', 'Rode lichten knipperen bij een spoorwegovergang. Wat doe je?', 'چراغ‌های سرخ در گذرگاه راه‌آهن چشمک می‌زنند. چه می‌کنید؟',
      'Doorrijden als je geen trein ziet', 'اگر قطار نمی‌بینید عبور می‌کنید', 'Stoppen vóór de overweg', 'پیش از گذرگاه توقف می‌کنید', 'Alleen snelheid verminderen', 'فقط سرعت را کم می‌کنید', 1, 'railway',
      'Bij rood knipperlicht stop je vóór de spoorwegovergang en wacht je tot oversteken weer is toegestaan.', 'هنگام چشمک‌زدن چراغ سرخ پیش از گذرگاه راه‌آهن توقف می‌کنید و تا مجاز شدن عبور منتظر می‌مانید.')
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
FROM data
CROSS JOIN content_releases AS release
WHERE release.version = 1
ON CONFLICT (release_id, external_key) DO UPDATE SET
  prompt = EXCLUDED.prompt,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  correct_option = EXCLUDED.correct_option,
  category = EXCLUDED.category,
  published = TRUE,
  updated_at = NOW();

UPDATE exam_definitions
SET question_count = 50,
    pass_score = 88,
    duration_seconds = 1800,
    updated_at = NOW()
WHERE release_id = (SELECT id FROM content_releases WHERE version = 1);

WITH added_questions AS (
  SELECT id, row_number() OVER (ORDER BY external_key) - 1 AS offset
  FROM exam_questions_v1
  WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND external_key LIKE 'cbr2025-q%'
)
INSERT INTO exam_definition_questions_v1 (exam_id, question_id, sort_order)
SELECT
  exam.id,
  question.id,
  (31 + ((question.offset + exam.exam_number - 1) % 20))::smallint
FROM exam_definitions AS exam
CROSS JOIN added_questions AS question
WHERE exam.release_id = (SELECT id FROM content_releases WHERE version = 1)
ON CONFLICT (exam_id, question_id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order;

INSERT INTO schema_migrations (version, name)
VALUES (6, 'cbr_2025_fifty_question_exams')
ON CONFLICT (version) DO NOTHING;

COMMIT;

