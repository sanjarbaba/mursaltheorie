-- First reviewed expansion batch: 12 bilingual questions in three new formats.
-- Rebuild the deterministic 50-question exam sets across the larger bank.

BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), data(external_key, question_type, prompt, options, explanation, correct_option, correct_answer, category) AS (
  VALUES
  ('cbr2025-q101','yes_no','{"nl":"Een richtingaanwijzer gebruiken geeft je automatisch voorrang. Juist of onjuist?","fa":"استفاده از چراغ راهنما به شما خودکار حق تقدم می‌دهد. درست یا نادرست؟"}'::jsonb,'[{"nl":"Juist","fa":"درست"},{"nl":"Onjuist","fa":"نادرست"}]'::jsonb,'{"nl":"Een richtingaanwijzer laat alleen je bedoeling zien en geeft geen voorrang.","fa":"چراغ راهنما فقط قصد شما را نشان می‌دهد و حق تقدم ایجاد نمی‌کند."}'::jsonb,1,'1'::jsonb,'manoeuvre'),
  ('cbr2025-q102','yes_no','{"nl":"Je mag een kruispunt oprijden wanneer je het door stilstaand verkeer niet volledig kunt vrijmaken. Juist of onjuist?","fa":"اگر به دلیل ترافیک ایستاده نتوانید تقاطع را کاملاً خالی کنید، می‌توانید وارد آن شوید. درست یا نادرست؟"}'::jsonb,'[{"nl":"Juist","fa":"درست"},{"nl":"Onjuist","fa":"نادرست"}]'::jsonb,'{"nl":"Je mag een kruispunt niet blokkeren, ook niet wanneer het verkeerslicht groen is.","fa":"حتی با چراغ سبز هم نباید تقاطع را مسدود کنید."}'::jsonb,1,'1'::jsonb,'intersection'),
  ('cbr2025-q103','yes_no','{"nl":"Bij ernstig beperkt zicht door mist mag je mistlicht vóór gebruiken. Juist of onjuist?","fa":"وقتی مه دید را شدیداً محدود کند، می‌توانید چراغ مه‌شکن جلو را استفاده کنید. درست یا نادرست؟"}'::jsonb,'[{"nl":"Juist","fa":"درست"},{"nl":"Onjuist","fa":"نادرست"}]'::jsonb,'{"nl":"Mistlicht vóór is toegestaan wanneer mist, sneeuwval of regen het zicht ernstig belemmert.","fa":"چراغ مه‌شکن جلو وقتی مه، برف یا باران دید را شدیداً کم کند مجاز است."}'::jsonb,0,'0'::jsonb,'light'),
  ('cbr2025-q104','yes_no','{"nl":"Achteruitrijden is een bijzondere manoeuvre. Juist of onjuist?","fa":"دنده عقب رفتن یک مانور ویژه است. درست یا نادرست؟"}'::jsonb,'[{"nl":"Juist","fa":"درست"},{"nl":"Onjuist","fa":"نادرست"}]'::jsonb,'{"nl":"Bij een bijzondere manoeuvre moet je al het overige verkeer voor laten gaan.","fa":"در مانور ویژه باید به همه کاربران دیگر راه بدهید."}'::jsonb,0,'0'::jsonb,'manoeuvre'),
  ('cbr2025-q105','numeric','{"nl":"Hoeveel meter vóór of na een zebrapad mag je niet stilstaan? Vul het aantal meters in.","fa":"تا چند متر پیش یا پس از گذرگاه عابر اجازه توقف ندارید؟ عدد را وارد کنید."}'::jsonb,'[]'::jsonb,'{"nl":"Stilstaan op een zebrapad of binnen vijf meter daarvan is verboden.","fa":"توقف روی گذرگاه عابر یا تا پنج متر از آن ممنوع است."}'::jsonb,0,'5'::jsonb,'stopping'),
  ('cbr2025-q106','numeric','{"nl":"Hoeveel meter moet je bij parkeren minstens van een kruispunt blijven? Vul het aantal meters in.","fa":"هنگام پارک حداقل چند متر باید از تقاطع فاصله بگیرید؟ عدد را وارد کنید."}'::jsonb,'[]'::jsonb,'{"nl":"Parkeren binnen vijf meter van een kruispunt is verboden.","fa":"پارک در فاصله کمتر از پنج متر از تقاطع ممنوع است."}'::jsonb,0,'5'::jsonb,'parking'),
  ('cbr2025-q107','numeric','{"nl":"Wat is meestal de maximumsnelheid binnen de bebouwde kom als borden niets anders aangeven? Vul km/u in.","fa":"اگر تابلو چیز دیگری نگوید، حداکثر سرعت معمول داخل شهر چند کیلومتر در ساعت است؟"}'::jsonb,'[]'::jsonb,'{"nl":"Binnen de bebouwde kom geldt meestal 50 km/u, tenzij anders aangegeven.","fa":"داخل شهر معمولاً ۵۰ کیلومتر در ساعت مجاز است، مگر خلاف آن اعلام شود."}'::jsonb,0,'50'::jsonb,'speed'),
  ('cbr2025-q108','numeric','{"nl":"Wat is overdag de algemene maximumsnelheid op een autosnelweg als borden niets anders aangeven? Vul km/u in.","fa":"در روز، اگر تابلو خلاف آن را نگوید، حد عمومی سرعت در بزرگراه چند کیلومتر در ساعت است؟"}'::jsonb,'[]'::jsonb,'{"nl":"Van 06.00 tot 19.00 uur geldt in beginsel 100 km/u; borden kunnen een andere limiet aangeven.","fa":"از ساعت ۶ تا ۱۹ اصولاً ۱۰۰ کیلومتر در ساعت مجاز است؛ تابلو می‌تواند حد دیگری نشان دهد."}'::jsonb,0,'100'::jsonb,'speed'),
  ('cbr2025-q109','multiple_response','{"nl":"Welke handelingen horen bij veilig wisselen van rijstrook? Kies alle juiste antwoorden.","fa":"کدام کارها برای تغییر ایمن خط عبور لازم است؟ همه جواب‌های درست را انتخاب کنید."}'::jsonb,'[{"nl":"Spiegels controleren","fa":"بررسی آینه‌ها"},{"nl":"Dode hoek controleren","fa":"بررسی نقطه کور"},{"nl":"Zonder kijken direct sturen","fa":"بدون نگاه فوراً فرمان دادن"}]'::jsonb,'{"nl":"Controleer spiegels en dode hoek, geef richting aan en verplaats alleen wanneer er ruimte is.","fa":"آینه‌ها و نقطه کور را بررسی کنید، راهنما بزنید و فقط وقتی جا هست تغییر خط دهید."}'::jsonb,0,'[0,1]'::jsonb,'road-position'),
  ('cbr2025-q110','multiple_response','{"nl":"Wat helpt bij veilig rijden in zware regen? Kies alle juiste antwoorden.","fa":"چه کارهایی در باران شدید به رانندگی ایمن کمک می‌کند؟ همه جواب‌های درست را انتخاب کنید."}'::jsonb,'[{"nl":"Snelheid verminderen","fa":"کاهش سرعت"},{"nl":"Meer volgafstand houden","fa":"افزایش فاصله تعقیب"},{"nl":"Dicht achter je voorganger rijden","fa":"نزدیک پشت موتر جلویی رانندگی کردن"}]'::jsonb,'{"nl":"Lagere snelheid en meer afstand geven extra tijd en ruimte om te reageren.","fa":"سرعت کمتر و فاصله بیشتر برای واکنش زمان و فضای بیشتری می‌دهد."}'::jsonb,0,'[0,1]'::jsonb,'weather'),
  ('cbr2025-q111','multiple_response','{"nl":"Wat controleer je vóór een lange rit aan de banden? Kies alle juiste antwoorden.","fa":"پیش از سفر طولانی چه چیزهایی را در تایرها بررسی می‌کنید؟ همه جواب‌های درست را انتخاب کنید."}'::jsonb,'[{"nl":"Bandenspanning","fa":"فشار باد"},{"nl":"Profiel en beschadigingen","fa":"آج و آسیب‌ها"},{"nl":"Alleen de kleur van de velg","fa":"فقط رنگ رینگ"}]'::jsonb,'{"nl":"Een juiste spanning, voldoende profiel en geen zichtbare beschadigingen zijn belangrijk voor veiligheid.","fa":"فشار درست، آج کافی و نبود آسیب دیدنی برای ایمنی مهم است."}'::jsonb,0,'[0,1]'::jsonb,'vehicle'),
  ('cbr2025-q112','multiple_response','{"nl":"Wat doe je bij pech op de autosnelweg als je veilig de vluchtstrook bereikt? Kies alle juiste antwoorden.","fa":"اگر هنگام خرابی در بزرگراه ایمن به شانه اضطراری رسیدید چه می‌کنید؟ همه جواب‌های درست را انتخاب کنید."}'::jsonb,'[{"nl":"Alarmlichten inschakelen","fa":"روشن کردن چراغ خطر"},{"nl":"Zo mogelijk achter de vangrail wachten","fa":"در صورت امکان پشت گاردریل منتظر ماندن"},{"nl":"Op de rijbaan blijven staan","fa":"در خط حرکت ایستادن"}]'::jsonb,'{"nl":"Maak het voertuig zichtbaar en wacht zo mogelijk achter de vangrail, ver van het verkeer.","fa":"موتر را قابل دید کنید و در صورت امکان پشت گاردریل، دور از ترافیک منتظر بمانید."}'::jsonb,0,'[0,1]'::jsonb,'emergency')
)
INSERT INTO exam_questions_v1 (
  release_id, external_key, question_type, prompt, options, explanation,
  correct_option, correct_answer, category, media, published
)
SELECT release.id, data.external_key, data.question_type, data.prompt, data.options,
  data.explanation, data.correct_option, data.correct_answer, data.category, '[]'::jsonb, TRUE
FROM data CROSS JOIN release
ON CONFLICT (release_id, external_key) DO UPDATE SET
  question_type = EXCLUDED.question_type,
  prompt = EXCLUDED.prompt,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  correct_option = EXCLUDED.correct_option,
  correct_answer = EXCLUDED.correct_answer,
  category = EXCLUDED.category,
  published = TRUE,
  updated_at = NOW();

DELETE FROM exam_definition_questions_v1 AS link
USING exam_definitions AS exam
WHERE link.exam_id = exam.id
  AND exam.release_id = (SELECT id FROM content_releases WHERE version = 1);

WITH selected AS (
  SELECT exam.id AS exam_id, question.id AS question_id,
    row_number() OVER (
      PARTITION BY exam.id
      ORDER BY md5(exam.exam_number::text || ':' || question.external_key)
    ) AS sort_order
  FROM exam_definitions AS exam
  JOIN exam_questions_v1 AS question
    ON question.release_id = exam.release_id AND question.published = TRUE
  WHERE exam.release_id = (SELECT id FROM content_releases WHERE version = 1)
)
INSERT INTO exam_definition_questions_v1 (exam_id, question_id, sort_order)
SELECT exam_id, question_id, sort_order::smallint
FROM selected WHERE sort_order <= 50;

DO $check$
DECLARE
  bank_count integer;
  invalid_exams integer;
BEGIN
  SELECT count(*) INTO bank_count FROM exam_questions_v1
  WHERE release_id = (SELECT id FROM content_releases WHERE version = 1) AND published = TRUE;
  SELECT count(*) INTO invalid_exams FROM (
    SELECT exam.id FROM exam_definitions AS exam
    LEFT JOIN exam_definition_questions_v1 AS link ON link.exam_id = exam.id
    WHERE exam.release_id = (SELECT id FROM content_releases WHERE version = 1)
    GROUP BY exam.id
    HAVING count(link.question_id) <> 50 OR count(DISTINCT link.question_id) <> 50
  ) invalid;
  IF bank_count < 112 OR invalid_exams <> 0 THEN
    RAISE EXCEPTION 'Question type expansion validation failed: bank=%, invalid_exams=%', bank_count, invalid_exams;
  END IF;
END
$check$;

INSERT INTO schema_migrations(version, name)
VALUES (27, 'expand_exam_bank_question_types')
ON CONFLICT (version) DO NOTHING;

COMMIT;

