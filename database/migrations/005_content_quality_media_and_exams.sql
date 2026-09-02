-- Content quality follow-up: persist reviewed exam explanations and lesson media fixes.
-- Safe to re-run: updates are deterministic and do not change question answers.

UPDATE exam_questions_v1
SET explanation = jsonb_build_object(
  'nl', 'Het juiste uitgangspunt is: ' || (options->correct_option->>'nl') || '. Controleer daarna de volledige verkeerssituatie voordat je handelt.',
  'fa', 'پاسخ درست این است: ' || (options->correct_option->>'fa') || '. سپس پیش از عمل، تمام وضعیت ترافیک را بررسی کنید.'
);

WITH media_map (lesson_no, media) AS (
  VALUES
    (2, 'theory-005-lights-check.webp'),
    (38, 'theory-010-bus-lane.webp'),
    (40, 'theory-029-three-point-turn.webp'),
    (46, 'theory-024-t-junction.webp'),
    (51, 'theory-026-pull-away.webp'),
    (52, 'theory-027-reverse-parking.webp'),
    (57, 'theory-020-driveway-exit.webp'),
    (69, 'theory-033-return-right.webp'),
    (72, 'theory-035-no-stopping.webp'),
    (86, 'Snelweg met matrixbord 80 en bord 100.jpg'),
    (87, 'theory-038-breakdown-shoulder.webp'),
    (90, 'Vroeg en rustig voorsorteren naar de afrit.jpg'),
    (98, 'theory-042-crosswind.webp'),
    (125, 'Slaperige bestuurder parkeert bij rustplaats.jpg')
)
UPDATE course_lessons AS l
SET media = to_jsonb(m.media::text)
FROM media_map AS m
WHERE l.lesson_no = m.lesson_no;
