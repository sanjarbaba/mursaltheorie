-- Replace generic copy and mismatched media in the special-manoeuvres module.

BEGIN;

WITH data (
  lesson_number, summary_nl, summary_fa,
  rule_nl, rule_fa, tip_nl, tip_fa, image_src
) AS (
  VALUES
    (51, 'Veilig wegrijden begint met kijken, richting aangeven en al het overige verkeer voor laten gaan.', 'حرکت ایمن با دیدن اطراف، راهنما زدن و راه دادن به تمام ترافیک دیگر آغاز می‌شود.', 'Wegrijden is een bijzondere manoeuvre. Kijk in de spiegels en dode hoek en laat al het overige verkeer voorgaan.', 'حرکت از حالت توقف یک مانور ویژه است. آینه‌ها و نقطه کور را ببینید و به تمام ترافیک دیگر راه بدهید.', 'Voer de manoeuvre pas uit als de vrije ruimte groot genoeg is; richting aangeven geeft geen voorrang.', 'فقط وقتی فضای آزاد کافی است حرکت کنید؛ راهنما زدن حق تقدم ایجاد نمی‌کند.', '/images/theory-026-pull-away.webp'),
    (52, 'Bij achteruitrijden beweeg je stapvoets en laat je al het overige verkeer voorgaan.', 'هنگام دنده‌عقب بسیار آهسته حرکت می‌کنید و به تمام ترافیک دیگر راه می‌دهید.', 'Achteruitrijden is een bijzondere manoeuvre. Controleer rondom, kijk achterom en stop direct bij twijfel.', 'دنده‌عقب یک مانور ویژه است. اطراف و پشت سر را ببینید و در صورت تردید فوراً توقف کنید.', 'Let extra op kinderen, fietsers en lage obstakels die niet goed in de spiegels zichtbaar zijn.', 'به کودکان، دوچرخه‌سواران و موانع کوتاه که در آینه خوب دیده نمی‌شوند توجه ویژه کنید.', '/images/theory-027-reverse-parking.webp'),
    (53, 'Bij uitparkeren controleer je vóór en naast de auto en geef je iedereen buiten het parkeervak voorrang.', 'هنگام بیرون آمدن از پارک، جلو و کنار موتر را بررسی کرده و به همه بیرون جای پارک راه می‌دهید.', 'Uitparkeren is een bijzondere manoeuvre; al het overige verkeer, ook voetgangers, gaat voor.', 'بیرون آمدن از پارک مانور ویژه است؛ تمام ترافیک دیگر، از جمله عابران، حق تقدم دارد.', 'Kijk in spiegels en dode hoek, geef tijdig richting aan en rijd langzaam uit het vak.', 'آینه‌ها و نقطه کور را ببینید، به‌موقع راهنما بزنید و آهسته از جای پارک بیرون شوید.', '/images/theory-028-exit-parking.webp'),
    (54, 'Parkeer langzaam, houd rondom ruimte en voorkom gevaar of hinder voor andere weggebruikers.', 'آهسته پارک کنید، اطراف فاصله نگه دارید و برای دیگران خطر یا مزاحمت ایجاد نکنید.', 'Tijdens het inparkeren voer je een bijzondere manoeuvre uit en laat je al het overige verkeer voorgaan.', 'هنگام پارک کردن مانور ویژه انجام می‌دهید و باید به تمام ترافیک دیگر راه بدهید.', 'Controleer vóór iedere stuurbeweging spiegels, dode hoek, voorzijde en achterzijde van de auto.', 'پیش از هر چرخش فرمان، آینه‌ها، نقطه کور، جلو و عقب موتر را بررسی کنید.', '/images/theory-027-reverse-parking.webp'),
    (55, 'Keren doe je alleen op een overzichtelijke plek waar het zonder gevaar of hinder kan.', 'دور زدن را فقط در محل دارای دید کافی و بدون خطر یا مزاحمت انجام دهید.', 'Keren is een bijzondere manoeuvre. Laat al het overige verkeer voorgaan en houd de omgeving voortdurend in de gaten.', 'دور زدن مانور ویژه است. به تمام ترافیک دیگر راه بدهید و پیوسته اطراف را کنترل کنید.', 'Keer niet bij een onoverzichtelijke bocht, helling, overweg of andere plaats waar je te laat wordt gezien.', 'در پیچ کور، سربالایی، گذرگاه راه‌آهن یا جایی که دیر دیده می‌شوید دور نزنید.', '/images/theory-029-three-point-turn.webp'),
    (56, 'Wissel alleen van rijstrook na spiegelcontrole, richting aangeven en een laatste blik in de dode hoek.', 'فقط پس از دیدن آینه‌ها، راهنما زدن و نگاه نهایی به نقطه کور خط را عوض کنید.', 'Van rijstrook wisselen is een bijzondere manoeuvre; verkeer dat al op de andere rijstrook rijdt gaat voor.', 'تغییر خط مانور ویژه است؛ ترافیکی که از قبل در خط دیگر است حق تقدم دارد.', 'Houd snelheid voorspelbaar en stuur geleidelijk wanneer er voldoende ruimte naast en achter je is.', 'سرعت را قابل پیش‌بینی نگه دارید و وقتی کنار و پشت فضای کافی است آرام تغییر مسیر دهید.', '/images/theory-030-lane-change.webp'),
    (57, 'Bij het verlaten van een uitrit laat je alle weggebruikers op de doorgaande weg voorgaan.', 'هنگام خروج از خروجی باید به تمام کاربران راه اصلی حق تقدم بدهید.', 'Uit een uitrit wegrijden is een bijzondere manoeuvre. Voetgangers, fietsers en bestuurders op de weg gaan voor.', 'بیرون آمدن از خروجی مانور ویژه است. عابران، دوچرخه‌سواران و رانندگان راه اصلی حق تقدم دارند.', 'Rijd stapvoets tot je voldoende zicht hebt en blokkeer het trottoir of fietspad niet tijdens het wachten.', 'تا زمانی که دید کافی دارید بسیار آهسته بروید و هنگام انتظار پیاده‌رو یا مسیر دوچرخه را نبندید.', '/images/theory-020-driveway-exit.webp'),
    (58, 'Ook bij het oprijden van een oprit vanaf de weg laat je al het overige verkeer voorgaan.', 'هنگام ورود از راه به ورودی نیز باید به تمام ترافیک دیگر راه بدهید.', 'Een oprit oprijden is een bijzondere manoeuvre. Controleer tegemoetkomend verkeer en verkeer achter je vóór je afslaat.', 'ورود به ورودی مانور ویژه است. پیش از پیچیدن ترافیک روبه‌رو و پشت سر را بررسی کنید.', 'Let bij het kruisen van trottoir of fietspad extra op voetgangers en fietsers in beide richtingen.', 'هنگام عبور از پیاده‌رو یا مسیر دوچرخه به عابران و دوچرخه‌سواران هر دو جهت توجه ویژه کنید.', '/images/theory-020-driveway-exit.webp'),
    (59, 'Wissel in langzaam rijdend verkeer alleen van rijstrook als dat echt nodig en volledig veilig is.', 'در ترافیک آهسته فقط وقتی واقعاً لازم و کاملاً ایمن است خط را عوض کنید.', 'Ook in een file blijft wisselen van rijstrook een bijzondere manoeuvre; de bestuurders op de andere rijstrook gaan voor.', 'حتی در ترافیک، تغییر خط مانور ویژه است و رانندگان خط دیگر حق تقدم دارند.', 'Voorkom voortdurend heen-en-weer wisselen en let extra op motoren die tussen rijen kunnen rijden.', 'از تغییر پی‌درپی خط خودداری کنید و به موتورسیکلت‌هایی که میان صف‌ها حرکت می‌کنند توجه ویژه کنید.', '/images/theory-030-lane-change.webp'),
    (60, 'Een veilige manoeuvre bestaat uit waarnemen, plannen, signaleren, voorrang geven en rustig uitvoeren.', 'مانور ایمن شامل دیدن، برنامه‌ریزی، علامت دادن، حق تقدم دادن و اجرای آرام است.', 'Controleer vóór en tijdens iedere bijzondere manoeuvre de volledige omgeving en laat al het overige verkeer voorgaan.', 'پیش و هنگام هر مانور ویژه تمام محیط را بررسی کنید و به تمام ترافیک دیگر راه بدهید.', 'Breek de manoeuvre af wanneer de situatie verandert of wanneer je het overzicht verliest.', 'اگر وضعیت تغییر کرد یا دید کافی را از دست دادید مانور را متوقف کنید.', '/images/theory-004-mirrors-blind-spot.webp')
), release AS (
  SELECT id FROM content_releases WHERE version = 1
)
UPDATE course_lessons AS lesson
SET summary = jsonb_build_object('nl', data.summary_nl, 'fa', data.summary_fa),
    content_blocks = jsonb_build_array(
      jsonb_build_object('type', 'rule', 'text', jsonb_build_object('nl', data.rule_nl, 'fa', data.rule_fa)),
      jsonb_build_object('type', 'exam_tip', 'text', jsonb_build_object('nl', data.tip_nl, 'fa', data.tip_fa))
    ),
    media = jsonb_build_array(
      jsonb_build_object('type', 'image', 'src', data.image_src, 'alt', lesson.title)
    ),
    updated_at = NOW()
FROM data, release
WHERE lesson.release_id = release.id
  AND lesson.lesson_number = data.lesson_number;

DO $check$
DECLARE
  updated_count integer;
BEGIN
  SELECT count(*) INTO updated_count
  FROM course_lessons
  WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND lesson_number BETWEEN 51 AND 60
    AND coalesce(content_blocks->0->'text'->>'nl', '') <> ''
    AND coalesce(content_blocks->0->'text'->>'fa', '') <> ''
    AND coalesce(media->0->>'src', '') <> '';
  IF updated_count <> 10 THEN
    RAISE EXCEPTION 'Special-manoeuvres validation failed: % lessons', updated_count;
  END IF;
END
$check$;

INSERT INTO schema_migrations (version, name)
VALUES (8, 'special_manoeuvres_content')
ON CONFLICT (version) DO NOTHING;

COMMIT;

