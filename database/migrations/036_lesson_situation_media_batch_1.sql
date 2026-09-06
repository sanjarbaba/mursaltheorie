-- First verified media correction batch. These lessons previously shared an
-- unrelated generic intersection image or another image from a different topic.

BEGIN;

WITH release AS (
  SELECT id FROM content_releases WHERE version = 1
), mapping(lesson_number, src) AS (
  VALUES
    (20, '/images/Blauwe auto bereidt rijstrookwissel voor.jpg'),
    (50, '/images/Direct botsingsgevaar op het kruispunt.jpg'),
    (62, '/images/Blauwe auto op de rechterrijstrook.jpg'),
    (65, '/images/Inhalen verboden bij doorgetrokken streep.jpg'),
    (67, '/images/questions/lesson-067-landbouwvoertuig-inhalen.jpg'),
    (70, '/images/Inhalen verboden bij doorgetrokken streep.jpg'),
    (79, '/images/Dozen bij remmen_ los of vastgezet.jpg'),
    (88, '/images/theory-038-breakdown-shoulder.webp'),
    (89, '/images/questions/lesson-089-file-veilig-rijden.jpg'),
    (94, '/images/theory-040-aquaplaning.webp'),
    (97, '/images/theory-041-low-sun.webp'),
    (99, '/images/Mistachterlicht bij 50 meter zicht.jpg'),
    (106, '/images/Rotonde verlaten met rechter richtingaanwijzer.jpg'),
    (110, '/images/Rode waarschuwingslamp bij stilstaande auto.jpg'),
    (117, '/images/questions/lesson-117-ouderen-oversteekplaats.jpg'),
    (119, '/images/questions/lesson-119-rolstoelgebruiker-oversteken.jpg'),
    (121, '/images/Beginnende bestuurder met alcoholgrens 0,2‰.jpg'),
    (122, '/images/Ervaren bestuurder_ alcoholgrens 0,5‰.jpg'),
    (123, '/images/questions/lesson-123-medicijnen-en-rijden.jpg'),
    (126, '/images/Geen smartphone tijdens het rijden.jpg'),
    (129, '/images/Reactie en remweg bij een obstakel.jpg'),
    (131, '/images/Dozen bij remmen_ los of vastgezet.jpg'),
    (138, '/images/questions/lesson-138-veilig-slepen.jpg'),
    (140, '/images/theory-049-caravan.webp'),
    (142, '/images/Bandenspanning controleren bij een koude band.jpg'),
    (144, '/images/Reactie en remweg bij een obstakel.jpg'),
    (145, '/images/theory-038-breakdown-shoulder.webp'),
    (149, '/images/theory-050-roadside-incident.webp')
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
  wrong_lesson_media integer;
  wrong_generated_media integer;
BEGIN
  SELECT count(*) INTO wrong_lesson_media
  FROM course_lessons AS lesson
  WHERE lesson.release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND lesson.lesson_number IN (20,50,62,65,67,70,79,88,89,94,97,99,106,110,117,119,121,122,123,126,129,131,138,140,142,144,145,149)
    AND lesson.media->0->>'src' = '/images/Twee auto''s rechtdoor op gelijkwaardig kruispunt.jpg';

  SELECT count(*) INTO wrong_generated_media
  FROM exam_questions_v1 AS question
  JOIN course_lessons AS lesson
    ON lesson.release_id = question.release_id
    AND lesson.lesson_number = ((substring(question.external_key FROM '[0-9]+$')::integer - 113) / 6) + 1
  WHERE question.release_id = (SELECT id FROM content_releases WHERE version = 1)
    AND question.external_key LIKE 'cbr2026-q%'
    AND question.media IS DISTINCT FROM lesson.media;

  IF wrong_lesson_media <> 0 OR wrong_generated_media <> 0 THEN
    RAISE EXCEPTION 'Situation media check failed: generic_lessons=%, mismatched_questions=%',
      wrong_lesson_media, wrong_generated_media;
  END IF;
END
$check$;

INSERT INTO schema_migrations(version, name)
VALUES (36, 'lesson_situation_media_batch_1')
ON CONFLICT (version) DO NOTHING;

COMMIT;
