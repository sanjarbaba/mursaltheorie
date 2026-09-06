-- Remove the final generic intersection placeholders from published lessons.

BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), mapping(lesson_number, src) AS (
  VALUES
    (77, '/images/questions/lesson-077-blauwe-zone.jpg'),
    (78, '/images/questions/lesson-078-gehandicaptenplaats.jpg'),
    (124, '/images/questions/lesson-124-drugs-verkeerscontrole.jpg'),
    (128, '/images/questions/lesson-128-emoties-eerst-kalmeren.jpg'),
    (130, '/images/questions/lesson-130-verantwoord-rijden.jpg'),
    (136, '/images/questions/lesson-136-gewicht-weegbrug.jpg'),
    (137, '/images/questions/lesson-137-remmen-met-lading.jpg'),
    (141, '/images/questions/lesson-141-zuinig-anticiperen.jpg'),
    (143, '/images/questions/lesson-143-stationair-motor-uit.jpg')
), updated_lessons AS (
  UPDATE course_lessons AS lesson SET
    media = jsonb_build_array(jsonb_build_object(
      'type', 'image',
      'src', mapping.src,
      'alt', lesson.title
    )),
    updated_at = NOW()
  FROM mapping
  WHERE lesson.release_id = (SELECT id FROM release)
    AND lesson.lesson_number = mapping.lesson_number
  RETURNING lesson.lesson_number, lesson.media
)
UPDATE exam_questions_v1 AS question SET
  media = updated_lessons.media,
  updated_at = NOW()
FROM updated_lessons
WHERE question.release_id = (SELECT id FROM release)
  AND question.external_key LIKE 'cbr2026-q%'
  AND ((substring(question.external_key FROM '[0-9]+$')::integer - 113) / 6) + 1 = updated_lessons.lesson_number;

DO $check$
DECLARE
  generic_lessons integer;
  mismatched_questions integer;
BEGIN
  SELECT count(*) INTO generic_lessons
  FROM course_lessons AS lesson
  WHERE lesson.release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND lesson.published = TRUE
    AND lesson.media->0->>'src' = '/images/Twee auto''s rechtdoor op gelijkwaardig kruispunt.jpg';

  SELECT count(*) INTO mismatched_questions
  FROM exam_questions_v1 AS question
  JOIN course_lessons AS lesson
    ON lesson.release_id = question.release_id
    AND lesson.lesson_number = ((substring(question.external_key FROM '[0-9]+$')::integer - 113) / 6) + 1
  WHERE question.release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND question.external_key LIKE 'cbr2026-q%'
    AND question.media IS DISTINCT FROM lesson.media;

  IF generic_lessons <> 0 OR mismatched_questions <> 0 THEN
    RAISE EXCEPTION 'Generic media removal failed: generic_lessons=%, mismatched_questions=%',
      generic_lessons, mismatched_questions;
  END IF;
END
$check$;

INSERT INTO schema_migrations(version, name)
VALUES (37, 'remove_generic_lesson_media')
ON CONFLICT (version) DO NOTHING;

COMMIT;
