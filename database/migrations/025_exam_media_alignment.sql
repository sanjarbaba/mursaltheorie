-- Replace broad category illustrations with the closest existing situation image.
-- This keeps every original question and answer intact while making the visual cue accurate.

BEGIN;

WITH media_map(external_key, image_src) AS (
  VALUES
    ('learn5-q02', '/images/Blauwe auto bereidt rijstrookwissel voor.jpg'),
    ('learn5-q12', '/images/Blauwe auto op landelijke 80-weg.jpg'),
    ('learn5-q16', '/images/Dode hoek bij rechts afslaan.jpg'),
    ('learn5-q17', '/images/theory-034-no-parking.webp'),
    ('learn5-q19', '/images/Vroeg en rustig voorsorteren naar de afrit.jpg'),
    ('learn5-q20', '/images/Blauwe auto rijdt door stilstaand water.jpg'),
    ('learn5-q24', '/images/theory-018-priority-road.webp'),
    ('learn5-q25', '/images/Blauwe auto haalt grijze auto links in.jpg'),
    ('learn5-q26', '/images/theory-021-traffic-lights.webp'),
    ('learn5-q27', '/images/Remweg_ 50 versus 100 km_u.jpg'),
    ('learn5-q29', '/images/Bandenspanning controleren bij een koude band.jpg')
)
UPDATE exam_questions_v1 AS question
SET media = jsonb_build_array(jsonb_build_object(
      'type', 'image',
      'src', media_map.image_src,
      'alt', question.prompt->>'nl'
    )),
    updated_at = NOW()
FROM media_map
WHERE question.external_key = media_map.external_key;

COMMIT;

