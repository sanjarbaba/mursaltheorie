BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), updated_lesson AS (
  UPDATE course_lessons AS lesson
  SET media = jsonb_build_array(jsonb_build_object(
        'type', 'image',
        'src', '/images/questions/lesson-037-tram-gelijkwaardig-kruispunt.jpg',
        'alt', jsonb_build_object(
          'nl', 'Een tram kruist voor een auto op een gelijkwaardig kruispunt',
          'fa', 'تراموا در تقاطع هم‌ارزش از مقابل موتر عبور می‌کند',
          'ps', 'ټرام په مساوي څلورلارې کې د موټر مخې ته تېرېږي'
        )
      )),
      updated_at = NOW()
  WHERE lesson.release_id = (SELECT id FROM release)
    AND lesson.lesson_number = 37
  RETURNING lesson.media
)
UPDATE exam_questions_v1 AS question
SET media = updated_lesson.media,
    updated_at = NOW()
FROM updated_lesson
WHERE question.release_id = (SELECT id FROM release)
  AND question.external_key LIKE 'cbr2026-q%'
  AND ((substring(question.external_key FROM '[0-9]+$')::integer - 113) / 6) + 1 = 37;

INSERT INTO schema_migrations(version, name)
VALUES (42, 'fix_exam_one_first_question_media')
ON CONFLICT (version) DO NOTHING;

COMMIT;

