-- Correct visibly mismatched lesson media and replace four inaccurate lesson
-- records. Regenerate the six derived questions for corrected lessons so the
-- exam bank cannot retain stale prompts or answers.

BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), mapping(lesson_number, src) AS (
  VALUES
    (10, '/images/questions/lesson-010-voertuigcontrole.jpg'),
    (43, '/images/theory-021-traffic-lights.webp'),
    (44, '/images/Auto slaat rechtsaf, fietser rijdt rechtdoor.jpg'),
    (45, '/images/theory-023-straight-same-road.webp'),
    (58, '/images/questions/lesson-058-oprit-fietspad.jpg'),
    (61, '/images/Blauwe auto haalt grijze auto links in.jpg'),
    (63, '/images/Inhalen verboden bij doorgetrokken streep.jpg'),
    (66, '/images/theory-031-overtake-cyclist.webp'),
    (68, '/images/theory-031-overtake-cyclist.webp'),
    (71, '/images/theory-034-no-parking.webp'),
    (74, '/images/Voetganger nadert zebrapad, auto stopt.jpg'),
    (75, '/images/questions/lesson-075-bushalte-vrijhouden.jpg'),
    (82, '/images/signs/G1.svg'),
    (84, '/images/theory-037-motorway-exit.webp'),
    (95, '/images/theory-040-aquaplaning.webp'),
    (96, '/images/Dimlicht zonder verblinding.jpg'),
    (100, '/images/questions/lesson-130-verantwoord-rijden.jpg'),
    (105, '/images/questions/lesson-105-dagrijlicht-donker.jpg'),
    (107, '/images/questions/lesson-107-alarmlichten.jpg'),
    (108, '/images/questions/lesson-108-claxon-gevaar.jpg'),
    (109, '/images/questions/lesson-109-remlichten.jpg'),
    (113, '/images/theory-031-overtake-cyclist.webp'),
    (114, '/images/questions/lesson-114-snorfiets.jpg'),
    (115, '/images/questions/lesson-115-bromfiets-dode-hoek.jpg'),
    (132, '/images/questions/lesson-132-uitstekende-lading.jpg'),
    (135, '/images/questions/lesson-135-aanhanger-snelweg.jpg'),
    (144, '/images/questions/lesson-130-verantwoord-rijden.jpg')
), updated_lessons AS (
  UPDATE course_lessons AS lesson SET
    media = jsonb_build_array(jsonb_build_object('type', 'image', 'src', mapping.src, 'alt', lesson.title)),
    updated_at = NOW()
  FROM mapping
  WHERE lesson.release_id = (SELECT id FROM release)
    AND lesson.lesson_number = mapping.lesson_number
  RETURNING lesson.lesson_number, lesson.media
)
UPDATE exam_questions_v1 AS question SET media = updated_lessons.media, updated_at = NOW()
FROM updated_lessons
WHERE question.release_id = (SELECT id FROM release)
  AND question.external_key LIKE 'cbr2026-q%'
  AND ((substring(question.external_key FROM '[0-9]+$')::integer - 113) / 6) + 1 = updated_lessons.lesson_number;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), corrected(lesson_number, summary, content_blocks) AS (
  VALUES
    (82,
      '{"nl":"Bord G1 geeft het begin van een autosnelweg aan.","fa":"تابلوی G1 آغاز شاهراه را نشان می‌دهد."}'::jsonb,
      '[{"type":"rule","text":{"nl":"Een autosnelweg begint bij bord G1. Houd je aan de snelheid die op borden of matrixborden staat.","fa":"شاهراه از تابلوی G1 آغاز می‌شود. سرعت درج‌شده روی تابلوها یا تابلوهای ماتریسی را رعایت کنید."}},{"type":"exam_tip","text":{"nl":"Herken G1 als begin autosnelweg en G2 als einde autosnelweg.","fa":"G1 را آغاز شاهراه و G2 را پایان شاهراه بشناسید."}},{"type":"quiz","question":{"nl":"Welk bord geeft het begin van een autosnelweg aan?","fa":"کدام تابلو آغاز شاهراه را نشان می‌دهد؟"},"options":[{"nl":"Bord G1","fa":"تابلوی G1"},{"nl":"Bord G2","fa":"تابلوی G2"},{"nl":"Bord G3","fa":"تابلوی G3"}],"correctOption":0,"explanation":{"nl":"G1 betekent begin autosnelweg; G2 betekent einde autosnelweg.","fa":"G1 به معنی آغاز شاهراه و G2 به معنی پایان شاهراه است."}}]'::jsonb),
    (114,
      '{"nl":"Een snorfiets herken je aan de blauwe kentekenplaat; de maximumconstructiesnelheid is 25 km/u en een goedgekeurde helm is verplicht.","fa":"موترسایکل سبک را با پلاک آبی می‌شناسید؛ سرعت ساخت آن حداکثر ۲۵ کیلومتر در ساعت است و کلاه ایمنی تأییدشده اجباری است."}'::jsonb,
      '[{"type":"rule","text":{"nl":"Een snorfiets heeft een blauwe kentekenplaat, een maximumconstructiesnelheid van 25 km/u en de bestuurder moet een goedgekeurde helm dragen.","fa":"موترسایکل سبک پلاک آبی و سرعت ساخت حداکثر ۲۵ کیلومتر در ساعت دارد و راننده باید کلاه ایمنی تأییدشده بپوشد."}},{"type":"exam_tip","text":{"nl":"Verwar de blauwe plaat van een snorfiets niet met de gele plaat van een bromfiets.","fa":"پلاک آبی موترسایکل سبک را با پلاک زرد موترسایکل تندرو اشتباه نکنید."}},{"type":"quiz","question":{"nl":"Waaraan herken je een snorfiets?","fa":"موترسایکل سبک را از چه چیزی می‌شناسید؟"},"options":[{"nl":"Blauwe kentekenplaat en maximaal 25 km/u","fa":"پلاک آبی و حداکثر ۲۵ کیلومتر در ساعت"},{"nl":"Gele kentekenplaat en maximaal 45 km/u","fa":"پلاک زرد و حداکثر ۴۵ کیلومتر در ساعت"},{"nl":"Geen kentekenplaat en geen helmplicht","fa":"بدون پلاک و بدون الزام کلاه ایمنی"}],"correctOption":0,"explanation":{"nl":"De blauwe kentekenplaat en maximumconstructiesnelheid van 25 km/u horen bij een snorfiets.","fa":"پلاک آبی و سرعت ساخت حداکثر ۲۵ کیلومتر در ساعت مربوط به موترسایکل سبک است."}}]'::jsonb),
    (132,
      '{"nl":"Uitstekende lading moet binnen de wettelijke grenzen blijven, stevig vastzitten en waar vereist duidelijk gemarkeerd zijn.","fa":"بار بیرون‌زده باید در حدود قانونی باشد، محکم بسته شود و در صورت لزوم به‌وضوح علامت‌گذاری شود."}'::jsonb,
      '[{"type":"rule","text":{"nl":"Zet uitstekende lading stevig vast en markeer haar wanneer de regels dat vereisen. De lading mag geen gevaar of slecht zicht veroorzaken.","fa":"بار بیرون‌زده را محکم ببندید و هرگاه قانون لازم بداند آن را علامت‌گذاری کنید. بار نباید خطر ایجاد کند یا دید را محدود سازد."}},{"type":"exam_tip","text":{"nl":"Controleer vóór vertrek bevestiging, zichtbaarheid en de toegestane afmetingen van de lading.","fa":"پیش از حرکت، مهار بار، دیده‌شدن و اندازه‌های مجاز آن را بررسی کنید."}},{"type":"quiz","question":{"nl":"Wat is juist bij uitstekende lading?","fa":"در مورد بار بیرون‌زده کدام پاسخ درست است؟"},"options":[{"nl":"Stevig vastzetten en zo nodig duidelijk markeren","fa":"محکم بستن و در صورت لزوم به‌وضوح علامت‌گذاری کردن"},{"nl":"Los laten liggen zodat de lading kan bewegen","fa":"بار را آزاد گذاشتن تا حرکت کند"},{"nl":"De verlichting en kentekenplaat ermee afdekken","fa":"پوشاندن چراغ‌ها و پلاک با بار"}],"correctOption":0,"explanation":{"nl":"Uitstekende lading moet veilig zijn bevestigd, zichtbaar zijn en volgens de regels worden gemarkeerd.","fa":"بار بیرون‌زده باید ایمن مهار شود، دیده شود و مطابق مقررات علامت‌گذاری گردد."}}]'::jsonb),
    (135,
      '{"nl":"Met een aanhangwagen of caravan tot 3.500 kg geldt op de autosnelweg maximaal 90 km/u; boven 3.500 kg maximaal 80 km/u.","fa":"با تریلر یا کاروان تا ۳۵۰۰ کیلوگرم در شاهراه حداکثر ۹۰ و بالاتر از آن حداکثر ۸۰ کیلومتر در ساعت مجاز است."}'::jsonb,
      '[{"type":"rule","text":{"nl":"Op de autosnelweg mag een auto met een aanhangwagen of caravan tot 3.500 kg maximaal 90 km/u rijden. Bij meer dan 3.500 kg is dat maximaal 80 km/u.","fa":"در شاهراه، موتر با تریلر یا کاروان تا ۳۵۰۰ کیلوگرم حداکثر ۹۰ کیلومتر در ساعت می‌رود؛ بالاتر از ۳۵۰۰ کیلوگرم حداکثر ۸۰ است."}},{"type":"exam_tip","text":{"nl":"Kijk naar het gewicht van de aanhanger én naar een eventueel lagere aangegeven maximumsnelheid.","fa":"هم وزن تریلر و هم هر محدودیت سرعت پایین‌تر روی تابلو را بررسی کنید."}},{"type":"quiz","question":{"nl":"Hoe hard mag een auto met een aanhangwagen van minder dan 3.500 kg maximaal op de autosnelweg?","fa":"موتر با تریلر کمتر از ۳۵۰۰ کیلوگرم در شاهراه حداکثر چه سرعتی دارد؟"},"options":[{"nl":"90 km/u","fa":"۹۰ کیلومتر در ساعت"},{"nl":"100 km/u","fa":"۱۰۰ کیلومتر در ساعت"},{"nl":"130 km/u","fa":"۱۳۰ کیلومتر در ساعت"}],"correctOption":0,"explanation":{"nl":"Voor een aanhangwagen of caravan onder 3.500 kg is de maximumsnelheid op de autosnelweg 90 km/u, tenzij een lagere limiet geldt.","fa":"برای تریلر یا کاروان زیر ۳۵۰۰ کیلوگرم، حداکثر سرعت در شاهراه ۹۰ کیلومتر در ساعت است، مگر محدودیت پایین‌تری برقرار باشد."}}]'::jsonb)
)
UPDATE course_lessons AS lesson SET
  summary = corrected.summary,
  content_blocks = corrected.content_blocks,
  updated_at = NOW()
FROM corrected
WHERE lesson.release_id = (SELECT id FROM release)
  AND lesson.lesson_number = corrected.lesson_number;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), source AS (
  SELECT lesson.release_id, lesson.lesson_number, lesson.title, lesson.media,
    quiz.block AS quiz, rule.block->'text' AS rule_text, tip.block->'text' AS tip_text
  FROM course_lessons AS lesson
  CROSS JOIN LATERAL (SELECT value AS block FROM jsonb_array_elements(lesson.content_blocks) WHERE value->>'type' = 'quiz' LIMIT 1) quiz
  CROSS JOIN LATERAL (SELECT value AS block FROM jsonb_array_elements(lesson.content_blocks) WHERE value->>'type' = 'rule' LIMIT 1) rule
  CROSS JOIN LATERAL (SELECT value AS block FROM jsonb_array_elements(lesson.content_blocks) WHERE value->>'type' = 'exam_tip' LIMIT 1) tip
  WHERE lesson.release_id = (SELECT id FROM release)
    AND lesson.lesson_number IN (82,114,132,135)
), variants AS (
  SELECT source.*, variant.number AS variant_number,
    112 + ((lesson_number - 1) * 6) + variant.number AS question_number
  FROM source CROSS JOIN generate_series(1, 6) AS variant(number)
), refreshed AS (
  SELECT *,
    CASE variant_number
      WHEN 1 THEN jsonb_build_object('nl', 'Oefenvraag ' || question_number || ' — ' || title->>'nl' || ': ' || quiz->'question'->>'nl', 'fa', 'سوال تمرینی ' || question_number || ' — ' || title->>'fa' || ': ' || quiz->'question'->>'fa')
      WHEN 2 THEN jsonb_build_object('nl', 'Oefenvraag ' || question_number || ' — Wat is in deze situatie bij ' || title->>'nl' || ' de juiste handelwijze?', 'fa', 'سوال تمرینی ' || question_number || ' — در این وضعیت درباره «' || title->>'fa' || '» رفتار درست چیست؟')
      WHEN 3 THEN jsonb_build_object('nl', 'Oefenvraag ' || question_number || ' — Waar let je op het examen bij ' || title->>'nl' || ' vooral op?', 'fa', 'سوال تمرینی ' || question_number || ' — در امتحان درباره «' || title->>'fa' || '» بیشتر به چه چیزی توجه می‌کنید؟')
      WHEN 4 THEN jsonb_build_object('nl', 'Oefenvraag ' || question_number || ' — Welke twee aanwijzingen zijn juist bij ' || title->>'nl' || '? Kies beide antwoorden.', 'fa', 'سوال تمرینی ' || question_number || ' — کدام دو راهنمایی درباره «' || title->>'fa' || '» درست است؟ هر دو را انتخاب کنید.')
      WHEN 5 THEN jsonb_build_object('nl', 'Oefenvraag ' || question_number || ' — Bij ' || title->>'nl' || ' geldt: ' || rule_text->>'nl' || ' Juist of onjuist?', 'fa', 'سوال تمرینی ' || question_number || ' — درباره «' || title->>'fa' || '»: ' || rule_text->>'fa' || ' درست یا نادرست؟')
      ELSE jsonb_build_object('nl', 'Oefenvraag ' || question_number || ' — Welke uitleg hoort bij de afgebeelde situatie over ' || title->>'nl' || '?', 'fa', 'سوال تمرینی ' || question_number || ' — کدام توضیح با وضعیت تصویری درباره «' || title->>'fa' || '» مطابقت دارد؟')
    END AS new_prompt,
    CASE variant_number
      WHEN 1 THEN quiz->'options'
      WHEN 2 THEN jsonb_build_array(rule_text, jsonb_build_object('nl','Ik negeer de situatie en rijd zonder controle door.','fa','وضعیت را نادیده می‌گیرم و بدون بررسی ادامه می‌دهم.'), jsonb_build_object('nl','Ik controleer de omgeving pas na mijn handeling.','fa','فقط پس از انجام کار محیط را بررسی می‌کنم.'))
      WHEN 3 THEN jsonb_build_array(tip_text, jsonb_build_object('nl','Alleen mijn snelheid is belangrijk.','fa','فقط سرعت من مهم است.'), jsonb_build_object('nl','Ik hoef de situatie niet te controleren.','fa','لازم نیست وضعیت را بررسی کنم.'))
      WHEN 4 THEN jsonb_build_array(rule_text, tip_text, jsonb_build_object('nl','Ik mag deze veiligheidsregels negeren.','fa','می‌توانم این قواعد ایمنی را نادیده بگیرم.'))
      WHEN 5 THEN jsonb_build_array(jsonb_build_object('nl','Juist','fa','درست'), jsonb_build_object('nl','Onjuist','fa','نادرست'))
      ELSE jsonb_build_array(quiz->'explanation', jsonb_build_object('nl','De afbeelding is niet belangrijk voor de beoordeling.','fa','تصویر برای ارزیابی مهم نیست.'), jsonb_build_object('nl','Zonder te kijken is dezelfde handeling altijd veilig.','fa','بدون نگاه کردن، همان کار همیشه ایمن است.'))
    END AS new_options
  FROM variants
)
UPDATE exam_questions_v1 AS question SET
  prompt = refreshed.new_prompt,
  options = refreshed.new_options,
  explanation = CASE refreshed.variant_number
    WHEN 1 THEN refreshed.quiz->'explanation'
    WHEN 4 THEN jsonb_build_object('nl','De kernregel en examentip zijn beide juist.','fa','قاعده اصلی و نکته امتحانی هر دو درست‌اند.')
    WHEN 5 THEN jsonb_build_object('nl','De stelling geeft de kernregel van deze les correct weer.','fa','این گزاره قاعده اصلی درس را درست بیان می‌کند.')
    ELSE refreshed.quiz->'explanation' END,
  correct_option = 0,
  correct_answer = CASE refreshed.variant_number WHEN 4 THEN '[0,1]'::jsonb ELSE '0'::jsonb END,
  media = refreshed.media,
  updated_at = NOW()
FROM refreshed
WHERE question.release_id = refreshed.release_id
  AND question.external_key = 'cbr2026-q' || refreshed.question_number;

DO $check$
DECLARE
  missing_media integer;
  bad_sources integer;
BEGIN
  SELECT count(*) INTO missing_media
  FROM course_lessons
  WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND lesson_number IN (10,43,44,45,58,61,63,66,68,71,74,75,82,84,95,96,100,105,107,108,109,113,114,115,132,135,144)
    AND (media IS NULL OR jsonb_array_length(media) = 0);

  SELECT count(*) INTO bad_sources
  FROM course_lessons
  WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND lesson_number IN (82,114,132,135)
    AND jsonb_array_length(content_blocks) <> 3;

  IF missing_media <> 0 OR bad_sources <> 0 THEN
    RAISE EXCEPTION 'Situation correction failed: missing_media=%, bad_sources=%', missing_media, bad_sources;
  END IF;
END
$check$;

INSERT INTO schema_migrations(version, name)
VALUES (38, 'correct_remaining_situation_content')
ON CONFLICT (version) DO NOTHING;

COMMIT;