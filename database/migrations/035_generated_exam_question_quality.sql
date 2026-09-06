-- Replace the ambiguous generated exam variants with questions whose answer is
-- determined entirely by the same lesson. Migration 028 used neighbouring
-- lessons as distractors; those rules could also be true and did not always
-- describe the image shown with the question.

BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), lesson_source AS (
  SELECT
    lesson.release_id,
    lesson.lesson_number,
    lesson.title,
    lesson.media,
    quiz.block AS quiz,
    rule.block->'text' AS rule_text,
    tip.block->'text' AS tip_text
  FROM course_lessons AS lesson
  CROSS JOIN LATERAL (
    SELECT item.block FROM jsonb_array_elements(lesson.content_blocks) AS item(block)
    WHERE item.block->>'type' = 'quiz' LIMIT 1
  ) AS quiz(block)
  CROSS JOIN LATERAL (
    SELECT item.block FROM jsonb_array_elements(lesson.content_blocks) AS item(block)
    WHERE item.block->>'type' = 'rule' LIMIT 1
  ) AS rule(block)
  CROSS JOIN LATERAL (
    SELECT item.block FROM jsonb_array_elements(lesson.content_blocks) AS item(block)
    WHERE item.block->>'type' = 'exam_tip' LIMIT 1
  ) AS tip(block)
  WHERE lesson.release_id = (SELECT id FROM release)
    AND lesson.published = TRUE
    AND lesson.lesson_number BETWEEN 1 AND 148
), generated AS (
  SELECT
    source.*,
    variant.number AS variant_number,
    112 + ((lesson_number - 1) * 6) + variant.number AS question_number
  FROM lesson_source AS source
  CROSS JOIN generate_series(1, 6) AS variant(number)
), corrected AS (
  SELECT
    release_id,
    'cbr2026-q' || question_number AS external_key,
    CASE variant_number WHEN 4 THEN 'multiple_response' WHEN 5 THEN 'yes_no' ELSE 'single_choice' END AS question_type,
    CASE variant_number
      WHEN 1 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — ' || (title->>'nl') || ': ' || (quiz->'question'->>'nl'),
        'fa', 'سوال تمرینی ' || question_number || ' — ' || (title->>'fa') || ': ' || (quiz->'question'->>'fa')
      )
      WHEN 2 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Wat is in deze situatie bij ' || (title->>'nl') || ' de juiste handelwijze?',
        'fa', 'سوال تمرینی ' || question_number || ' — در این وضعیت درباره «' || (title->>'fa') || '» رفتار درست چیست؟'
      )
      WHEN 3 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Waar let je op het examen bij ' || (title->>'nl') || ' vooral op?',
        'fa', 'سوال تمرینی ' || question_number || ' — در امتحان درباره «' || (title->>'fa') || '» بیشتر به چه چیزی توجه می‌کنید؟'
      )
      WHEN 4 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Welke twee aanwijzingen zijn juist bij ' || (title->>'nl') || '? Kies beide antwoorden.',
        'fa', 'سوال تمرینی ' || question_number || ' — کدام دو راهنمایی درباره «' || (title->>'fa') || '» درست است؟ هر دو را انتخاب کنید.'
      )
      WHEN 5 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — ' || CASE WHEN lesson_number % 2 = 1
          THEN 'Bij ' || (title->>'nl') || ' geldt: ' || (rule_text->>'nl')
          ELSE 'Bij ' || (title->>'nl') || ' hoef je geen verkeersborden, wegmarkering of andere weggebruikers te controleren.' END || ' Juist of onjuist?',
        'fa', 'سوال تمرینی ' || question_number || ' — ' || CASE WHEN lesson_number % 2 = 1
          THEN 'درباره «' || (title->>'fa') || '»: ' || (rule_text->>'fa')
          ELSE 'درباره «' || (title->>'fa') || '» لازم نیست علایم، خط‌کشی یا کاربران دیگر راه را بررسی کنید.' END || ' درست یا نادرست؟'
      )
      ELSE jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Welke uitleg hoort bij de afgebeelde situatie over ' || (title->>'nl') || '?',
        'fa', 'سوال تمرینی ' || question_number || ' — کدام توضیح با وضعیت تصویری درباره «' || (title->>'fa') || '» مطابقت دارد؟'
      )
    END AS prompt,
    CASE variant_number
      WHEN 1 THEN quiz->'options'
      WHEN 2 THEN jsonb_build_array(
        rule_text,
        jsonb_build_object('nl', 'Ik negeer de situatie en blijf zonder controle doorrijden.', 'fa', 'وضعیت را نادیده می‌گیرم و بدون بررسی ادامه می‌دهم.'),
        jsonb_build_object('nl', 'Ik kijk alleen recht vooruit en controleer niets rondom de auto.', 'fa', 'فقط مستقیم را نگاه می‌کنم و اطراف موتر را بررسی نمی‌کنم.')
      )
      WHEN 3 THEN jsonb_build_array(
        tip_text,
        jsonb_build_object('nl', 'Alleen de snelheidsmeter is belangrijk; de verkeerssituatie niet.', 'fa', 'فقط سرعت‌سنج مهم است و وضعیت ترافیک مهم نیست.'),
        jsonb_build_object('nl', 'Ik hoef pas te kijken nadat ik de handeling al heb uitgevoerd.', 'fa', 'فقط بعد از انجام کار لازم است نگاه کنم.')
      )
      WHEN 4 THEN jsonb_build_array(
        rule_text,
        tip_text,
        jsonb_build_object('nl', 'Ik mag de situatie negeren zolang ik zelf geen gevaar zie.', 'fa', 'تا وقتی خودم خطری نمی‌بینم می‌توانم وضعیت را نادیده بگیرم.')
      )
      WHEN 5 THEN jsonb_build_array(
        jsonb_build_object('nl', 'Juist', 'fa', 'درست'),
        jsonb_build_object('nl', 'Onjuist', 'fa', 'نادرست')
      )
      ELSE jsonb_build_array(
        quiz->'explanation',
        jsonb_build_object('nl', 'De afbeelding heeft geen invloed op de beoordeling van de verkeerssituatie.', 'fa', 'تصویر در ارزیابی وضعیت ترافیک نقشی ندارد.'),
        jsonb_build_object('nl', 'Zonder te kijken kun je altijd veilig dezelfde handeling uitvoeren.', 'fa', 'بدون نگاه کردن همیشه می‌توانید همان کار را با ایمنی انجام دهید.')
      )
    END AS options,
    CASE variant_number
      WHEN 1 THEN quiz->'explanation'
      WHEN 2 THEN jsonb_build_object('nl', 'Deze handelwijze volgt de kernregel van deze les en past bij het getoonde onderwerp.', 'fa', 'این رفتار از قاعده اصلی همین درس پیروی می‌کند و با موضوع تصویر مطابقت دارد.')
      WHEN 3 THEN jsonb_build_object('nl', 'Deze examentip hoort rechtstreeks bij dit onderwerp; de andere keuzes laten noodzakelijke controles weg.', 'fa', 'این نکته امتحانی مستقیماً به همین موضوع مربوط است؛ گزینه‌های دیگر بررسی‌های ضروری را حذف می‌کنند.')
      WHEN 4 THEN jsonb_build_object('nl', 'De kernregel en de examentip zijn beide juist. De derde keuze is bewust onveilig.', 'fa', 'قاعده اصلی و نکته امتحانی هر دو درست‌اند. گزینه سوم عمداً ناایمن است.')
      WHEN 5 THEN jsonb_build_object(
        'nl', CASE WHEN lesson_number % 2 = 1 THEN 'De stelling geeft de kernregel van deze les correct weer.' ELSE 'Je moet de verkeerssituatie altijd controleren; daarom is de stelling onjuist.' END,
        'fa', CASE WHEN lesson_number % 2 = 1 THEN 'این گزاره قاعده اصلی این درس را درست بیان می‌کند.' ELSE 'همیشه باید وضعیت ترافیک را بررسی کنید؛ بنابراین گزاره نادرست است.' END
      )
      ELSE quiz->'explanation'
    END AS explanation,
    CASE variant_number
      WHEN 1 THEN (quiz->>'correctOption')::smallint
      WHEN 5 THEN CASE WHEN lesson_number % 2 = 1 THEN 0 ELSE 1 END
      ELSE 0
    END AS correct_option,
    CASE variant_number
      WHEN 1 THEN to_jsonb((quiz->>'correctOption')::integer)
      WHEN 4 THEN '[0,1]'::jsonb
      WHEN 5 THEN to_jsonb(CASE WHEN lesson_number % 2 = 1 THEN 0 ELSE 1 END)
      ELSE '0'::jsonb
    END AS correct_answer,
    media
  FROM generated
)
UPDATE exam_questions_v1 AS question SET
  question_type = corrected.question_type,
  prompt = corrected.prompt,
  options = corrected.options,
  explanation = corrected.explanation,
  correct_option = corrected.correct_option,
  correct_answer = corrected.correct_answer,
  media = corrected.media,
  updated_at = NOW()
FROM corrected
WHERE question.release_id = corrected.release_id
  AND question.external_key = corrected.external_key;

DO $check$
DECLARE
  corrected_count integer;
  neighbour_references integer;
  invalid_answers integer;
BEGIN
  SELECT count(*) INTO corrected_count
  FROM exam_questions_v1 AS question
  WHERE question.release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND question.external_key LIKE 'cbr2026-q%'
    AND question.published = TRUE;

  SELECT count(*) INTO neighbour_references
  FROM exam_questions_v1 AS question
  WHERE question.release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND question.external_key LIKE 'cbr2026-q%'
    AND (question.options::text LIKE '%ander onderwerp%'
      OR question.explanation::text LIKE '%ander onderwerp%');

  SELECT count(*) INTO invalid_answers
  FROM exam_questions_v1 AS question
  WHERE question.release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND question.external_key LIKE 'cbr2026-q%'
    AND (jsonb_typeof(question.options) <> 'array'
      OR jsonb_array_length(question.options) < 2
      OR question.correct_option < 0
      OR question.correct_option >= jsonb_array_length(question.options));

  IF corrected_count <> 888 OR neighbour_references <> 0 OR invalid_answers <> 0 THEN
    RAISE EXCEPTION 'Generated question quality check failed: corrected=%, neighbour_refs=%, invalid_answers=%',
      corrected_count, neighbour_references, invalid_answers;
  END IF;
END
$check$;

INSERT INTO schema_migrations(version, name)
VALUES (35, 'generated_exam_question_quality')
ON CONFLICT (version) DO NOTHING;

COMMIT;
