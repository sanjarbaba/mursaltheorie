BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
),
media_map(lesson_number, src) AS (
  VALUES
    (8, '/images/questions/lesson-008-verlichting.jpg'),
    (22, '/images/questions/lesson-022-veilige-snelheid.jpg'),
    (23, '/images/questions/lesson-023-reactieafstand.jpg'),
    (28, '/images/questions/lesson-028-mist-en-zicht.jpg'),
    (30, '/images/questions/lesson-030-snelheid-autosnelweg.jpg'),
    (38, '/images/questions/lesson-038-bus-bebouwde-kom.jpg'),
    (41, '/images/questions/lesson-041-gelijkwaardig-kruispunt.jpg'),
    (54, '/images/questions/lesson-054-inparkeren.jpg'),
    (56, '/images/questions/lesson-056-rijstrook-wisselen.jpg'),
    (57, '/images/questions/lesson-057-uitrit-verlaten.jpg'),
    (60, '/images/questions/lesson-060-manoeuvre-veilig.jpg'),
    (68, '/images/questions/lesson-068-veilige-zijafstand.jpg'),
    (84, '/images/questions/lesson-084-uitvoegstrook.jpg'),
    (91, '/images/questions/lesson-091-regen.jpg'),
    (92, '/images/questions/lesson-092-mist.jpg'),
    (94, '/images/questions/lesson-094-gladheid.jpg'),
    (96, '/images/questions/lesson-096-donker.jpg'),
    (100, '/images/questions/lesson-100-veilige-aanpassing.jpg'),
    (106, '/images/questions/lesson-106-richtingaanwijzer.jpg'),
    (113, '/images/questions/lesson-113-fietsers.jpg'),
    (126, '/images/questions/lesson-126-afleiding.jpg'),
    (140, '/images/questions/lesson-140-zicht-aanhanger.jpg'),
    (144, '/images/questions/lesson-144-anticiperen.jpg'),
    (145, '/images/questions/lesson-145-pech.jpg')
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
VALUES (41, 'make_all_lesson_media_unique')
ON CONFLICT (version) DO NOTHING;

COMMIT;