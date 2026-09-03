-- Expand the reviewed bilingual question bank from 112 to exactly 1,000 questions.
-- The 888 new questions are derived from the reviewed rule, exam tip and quiz
-- content of lessons 1-148. Each lesson contributes six distinct applications.

BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), lesson_source AS (
  SELECT
    lesson.release_id,
    lesson.lesson_number,
    lesson.title,
    lesson.media,
    module.slug AS category,
    quiz.block AS quiz,
    rule.block->'text' AS rule_text,
    tip.block->'text' AS tip_text
  FROM course_lessons AS lesson
  JOIN course_modules AS module
    ON module.id = lesson.module_id AND module.release_id = lesson.release_id
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
), enriched AS (
  SELECT
    source.*,
    next_one.rule_text AS next_rule,
    next_two.rule_text AS second_next_rule,
    next_one.tip_text AS next_tip,
    next_two.tip_text AS second_next_tip,
    next_one.quiz->'explanation' AS next_summary,
    next_two.quiz->'explanation' AS second_next_summary
  FROM lesson_source AS source
  JOIN lesson_source AS next_one
    ON next_one.lesson_number = (source.lesson_number % 148) + 1
  JOIN lesson_source AS next_two
    ON next_two.lesson_number = ((source.lesson_number + 1) % 148) + 1
), generated AS (
  SELECT
    enriched.*,
    variant.number AS variant_number,
    112 + ((lesson_number - 1) * 6) + variant.number AS question_number,
    CASE variant.number
      WHEN 1 THEN 'single_choice'
      WHEN 2 THEN 'single_choice'
      WHEN 3 THEN 'single_choice'
      WHEN 4 THEN 'multiple_response'
      WHEN 5 THEN 'yes_no'
      ELSE 'single_choice'
    END AS question_type
  FROM enriched
  CROSS JOIN generate_series(1, 6) AS variant(number)
), questions AS (
  SELECT
    release_id,
    'cbr2026-q' || question_number AS external_key,
    question_type,
    CASE variant_number
      WHEN 1 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — ' || (title->>'nl') || ': ' || (quiz->'question'->>'nl'),
        'fa', 'سوال تمرینی ' || question_number || ' — ' || (title->>'fa') || ': ' || (quiz->'question'->>'fa')
      )
      WHEN 2 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Welke handelwijze past het best bij ' || (title->>'nl') || '?',
        'fa', 'سوال تمرینی ' || question_number || ' — کدام روش برای «' || (title->>'fa') || '» مناسب‌تر است؟'
      )
      WHEN 3 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Welke examentip hoort bij ' || (title->>'nl') || '?',
        'fa', 'سوال تمرینی ' || question_number || ' — کدام نکته امتحانی به «' || (title->>'fa') || '» مربوط است؟'
      )
      WHEN 4 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Welke twee aandachtspunten horen bij ' || (title->>'nl') || '? Kies alle juiste antwoorden.',
        'fa', 'سوال تمرینی ' || question_number || ' — کدام دو نکته به «' || (title->>'fa') || '» مربوط است؟ همه جواب‌های درست را انتخاب کنید.'
      )
      WHEN 5 THEN jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Bij ' || (title->>'nl') || ' geldt: ' ||
          (CASE WHEN lesson_number % 2 = 1 THEN rule_text->>'nl' ELSE next_rule->>'nl' END) || ' Juist of onjuist?',
        'fa', 'سوال تمرینی ' || question_number || ' — درباره «' || (title->>'fa') || '»: ' ||
          (CASE WHEN lesson_number % 2 = 1 THEN rule_text->>'fa' ELSE next_rule->>'fa' END) || ' درست یا نادرست؟'
      )
      ELSE jsonb_build_object(
        'nl', 'Oefenvraag ' || question_number || ' — Wat is de belangrijkste kern van ' || (title->>'nl') || '?',
        'fa', 'سوال تمرینی ' || question_number || ' — مهم‌ترین اصل «' || (title->>'fa') || '» چیست؟'
      )
    END AS prompt,
    CASE variant_number
      WHEN 1 THEN quiz->'options'
      WHEN 2 THEN jsonb_build_array(rule_text, next_rule, second_next_rule)
      WHEN 3 THEN jsonb_build_array(next_tip, tip_text, second_next_tip)
      WHEN 4 THEN jsonb_build_array(rule_text, next_rule, tip_text)
      WHEN 5 THEN jsonb_build_array(
        jsonb_build_object('nl', 'Juist', 'fa', 'درست'),
        jsonb_build_object('nl', 'Onjuist', 'fa', 'نادرست')
      )
      ELSE jsonb_build_array(next_summary, second_next_summary, quiz->'explanation')
    END AS options,
    CASE variant_number
      WHEN 1 THEN quiz->'explanation'
      WHEN 2 THEN jsonb_build_object(
        'nl', 'Bij ' || (title->>'nl') || ' is dit de passende kernregel: ' || (rule_text->>'nl'),
        'fa', 'در موضوع «' || (title->>'fa') || '» این قاعده اصلی مناسب است: ' || (rule_text->>'fa')
      )
      WHEN 3 THEN jsonb_build_object(
        'nl', 'Deze examentip helpt je de situatie rond ' || (title->>'nl') || ' juist te beoordelen: ' || (tip_text->>'nl'),
        'fa', 'این نکته امتحانی برای ارزیابی درست «' || (title->>'fa') || '» کمک می‌کند: ' || (tip_text->>'fa')
      )
      WHEN 4 THEN jsonb_build_object(
        'nl', 'Zowel de kernregel als de examentip horen bij dit onderwerp.',
        'fa', 'هم قاعده اصلی و هم نکته امتحانی به این موضوع مربوط‌اند.'
      )
      WHEN 5 THEN jsonb_build_object(
        'nl', CASE WHEN lesson_number % 2 = 1
          THEN 'De stelling beschrijft de juiste regel voor dit onderwerp.'
          ELSE 'De stelling hoort bij een ander onderwerp en is hier daarom onjuist.' END,
        'fa', CASE WHEN lesson_number % 2 = 1
          THEN 'این گزاره قاعده درست این موضوع را بیان می‌کند.'
          ELSE 'این گزاره به موضوع دیگری مربوط است و در اینجا نادرست است.' END
      )
      ELSE quiz->'explanation'
    END AS explanation,
    CASE variant_number
      WHEN 1 THEN (quiz->>'correctOption')::smallint
      WHEN 2 THEN 0
      WHEN 3 THEN 1
      WHEN 4 THEN 0
      WHEN 5 THEN CASE WHEN lesson_number % 2 = 1 THEN 0 ELSE 1 END
      ELSE 2
    END AS correct_option,
    CASE variant_number
      WHEN 1 THEN to_jsonb((quiz->>'correctOption')::integer)
      WHEN 2 THEN '0'::jsonb
      WHEN 3 THEN '1'::jsonb
      WHEN 4 THEN '[0,2]'::jsonb
      WHEN 5 THEN to_jsonb(CASE WHEN lesson_number % 2 = 1 THEN 0 ELSE 1 END)
      ELSE '2'::jsonb
    END AS correct_answer,
    category,
    media
  FROM generated
)
INSERT INTO exam_questions_v1 (
  release_id, external_key, question_type, prompt, options, explanation,
  correct_option, correct_answer, category, media, published
)
SELECT
  release_id, external_key, question_type, prompt, options, explanation,
  correct_option, correct_answer, category, media, TRUE
FROM questions
ON CONFLICT (release_id, external_key) DO UPDATE SET
  question_type = EXCLUDED.question_type,
  prompt = EXCLUDED.prompt,
  options = EXCLUDED.options,
  explanation = EXCLUDED.explanation,
  correct_option = EXCLUDED.correct_option,
  correct_answer = EXCLUDED.correct_answer,
  category = EXCLUDED.category,
  media = EXCLUDED.media,
  published = TRUE,
  updated_at = NOW();

DELETE FROM exam_definition_questions_v1 AS link
USING exam_definitions AS exam
WHERE link.exam_id = exam.id
  AND exam.release_id = (SELECT id FROM content_releases WHERE version = 1);

-- A deterministic hash creates a different 50-question set for each exam.
-- Across 30 exams, a bank item is used about 1.5 times on average.
WITH selected AS (
  SELECT
    exam.id AS exam_id,
    question.id AS question_id,
    row_number() OVER (
      PARTITION BY exam.id
      ORDER BY md5(exam.exam_number::text || ':bank-1000:' || question.external_key)
    ) AS sort_order
  FROM exam_definitions AS exam
  JOIN exam_questions_v1 AS question
    ON question.release_id = exam.release_id AND question.published = TRUE
  WHERE exam.release_id = (SELECT id FROM content_releases WHERE version = 1)
)
INSERT INTO exam_definition_questions_v1 (exam_id, question_id, sort_order)
SELECT exam_id, question_id, sort_order::smallint
FROM selected
WHERE sort_order <= 50;

DO $check$
DECLARE
  bank_count integer;
  generated_count integer;
  duplicate_prompts integer;
  invalid_exams integer;
BEGIN
  SELECT count(*) INTO bank_count
  FROM exam_questions_v1
  WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND published = TRUE;

  SELECT count(*) INTO generated_count
  FROM exam_questions_v1
  WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND external_key LIKE 'cbr2026-q%'
    AND published = TRUE;

  SELECT count(*) INTO duplicate_prompts FROM (
    SELECT prompt->>'nl'
    FROM exam_questions_v1
    WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
      AND published = TRUE
    GROUP BY prompt->>'nl'
    HAVING count(*) > 1
  ) AS duplicates;

  SELECT count(*) INTO invalid_exams FROM (
    SELECT exam.id
    FROM exam_definitions AS exam
    LEFT JOIN exam_definition_questions_v1 AS link ON link.exam_id = exam.id
    WHERE exam.release_id = (SELECT id FROM content_releases WHERE version = 1)
    GROUP BY exam.id
    HAVING count(link.question_id) <> 50
      OR count(DISTINCT link.question_id) <> 50
  ) AS invalid;

  IF bank_count <> 1000 OR generated_count <> 888 OR duplicate_prompts <> 0 OR invalid_exams <> 0 THEN
    RAISE EXCEPTION
      '1000-question validation failed: bank=%, generated=%, duplicate_prompts=%, invalid_exams=%',
      bank_count, generated_count, duplicate_prompts, invalid_exams;
  END IF;
END
$check$;

INSERT INTO schema_migrations(version, name)
VALUES (28, 'expand_exam_bank_to_1000')
ON CONFLICT (version) DO NOTHING;

COMMIT;

