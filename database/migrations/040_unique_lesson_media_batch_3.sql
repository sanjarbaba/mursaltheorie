BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
),
media_map(lesson_number, src) AS (
  VALUES
    (40, '/images/questions/lesson-040-bijzondere-manoeuvre.jpg'),
    (49, '/images/questions/lesson-049-kruispunt-voetgangers.jpg'),
    (59, '/images/questions/lesson-059-file-wisselen.jpg'),
    (65, '/images/questions/lesson-065-inhalen-kruispunt.jpg'),
    (70, '/images/questions/lesson-070-inhalen-gevaar.jpg'),
    (74, '/images/questions/lesson-074-parkeren-zebrapad.jpg'),
    (88, '/images/questions/lesson-088-vluchtstrook.jpg'),
    (99, '/images/questions/lesson-099-slecht-zicht.jpg'),
    (103, '/images/questions/lesson-103-mistlicht-voor.jpg'),
    (129, '/images/questions/lesson-129-reactievermogen.jpg')
),
updated_lessons AS (
  UPDATE course_lessons AS lesson
  SET media = jsonb_build_array(
        jsonb_build_object('type', 'image', 'src', media_map.src, 'alt', lesson.title)
      ),
      updated_at = NOW()
  FROM media_map
  WHERE lesson.release_id = (SELECT id FROM release)
    AND lesson.lesson_number = media_map.lesson_number
  RETURNING lesson.lesson_number, lesson.media
)
UPDATE exam_questions_v1 AS question
SET media = updated_lessons.media,
    updated_at = NOW()
FROM updated_lessons
WHERE question.release_id = (SELECT id FROM release)
  AND question.external_key LIKE 'cbr2026-q%'
  AND ((substring(question.external_key FROM '[0-9]+$')::int - 113) / 6) + 1 = updated_lessons.lesson_number;

INSERT INTO schema_migrations(version, name)
VALUES (40, 'unique_lesson_media_batch_3')
ON CONFLICT (version) DO NOTHING;

COMMIT;