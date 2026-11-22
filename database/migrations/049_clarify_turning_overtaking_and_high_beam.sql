-- Replace reviewed questions as complete sets to avoid offsets between questions and options.
-- Existing question IDs, answer positions, and exam links are preserved.
WITH fixes AS (
  SELECT * FROM jsonb_to_recordset($fixes$
[
  {
    "lesson_number": 44,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Je slaat rechtsaf. Een fietser naast je rijdt op dezelfde weg rechtdoor. Wie gaat voor?",
        "fa": "به راست می‌پیچید. دوچرخه‌سواری در کنار شما در همان راه مستقیم می‌رود. چه کسی اول می‌گذرد؟",
        "ps": "تاسو ښي لور ته تاوېږئ. یو بایسکل چلوونکی مو څنګ ته پر هماغه لاره نېغ ځي. څوک لومړی تېرېږي؟"
      },
      "options": [
        {
          "nl": "Laat de fietser die op dezelfde weg rechtdoor gaat voorgaan.",
          "fa": "به دوچرخه‌سواری که در همان راه مستقیم می‌رود اجازه دهید اول بگذرد.",
          "ps": "هغه بایسکل چلوونکی لومړی پرېږدئ چې پر هماغه لاره نېغ ځي."
        },
        {
          "nl": "Jij, omdat je rechtsaf slaat.",
          "fa": "شما، چون به راست می‌پیچید.",
          "ps": "تاسو، ځکه چې ښي لور ته تاوېږئ."
        },
        {
          "nl": "Jij, als je richting aangeeft.",
          "fa": "شما، اگر چراغ راهنما بزنید.",
          "ps": "تاسو، که د تاوېدو اشاره وکړئ."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Laat de fietser die op dezelfde weg rechtdoor gaat voorgaan.",
        "fa": "به دوچرخه‌سواری که در همان راه مستقیم می‌رود اجازه دهید اول بگذرد.",
        "ps": "هغه بایسکل چلوونکی لومړی پرېږدئ چې پر هماغه لاره نېغ ځي."
      }
    }
  },
  {
    "lesson_number": 66,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Je wilt een fietser inhalen, maar er is weinig ruimte. Wat doe je?",
        "fa": "می‌خواهید از دوچرخه‌سوار سبقت بگیرید، اما فضای کافی ندارید. چه می‌کنید؟",
        "ps": "غواړئ له بایسکل چلوونکي مخکې شئ، خو کافي ځای نشته. څه کوئ؟"
      },
      "options": [
        {
          "nl": "Blijf erachter tot je veilig met voldoende zijafstand kunt inhalen.",
          "fa": "پشت دوچرخه‌سوار بمانید تا بتوانید با فاصله جانبی کافی و ایمن سبقت بگیرید.",
          "ps": "تر شا یې پاتې شئ تر څو په کافي اړخیز واټن او خوندي ډول ترې مخکې شئ."
        },
        {
          "nl": "Haal langzaam in, ook als je vlak langs de fietser rijdt.",
          "fa": "آرام سبقت بگیرید، حتی اگر از کنار دوچرخه‌سوار خیلی نزدیک بگذرید.",
          "ps": "ورو ترې مخکې شئ، که څه هم ډېر نږدې ترې تېرېږئ."
        },
        {
          "nl": "Toeter en haal meteen in.",
          "fa": "بوق بزنید و فوراً سبقت بگیرید.",
          "ps": "هارن ووهئ او سمدستي ترې مخکې شئ."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Blijf erachter tot je veilig met voldoende zijafstand kunt inhalen.",
        "fa": "پشت دوچرخه‌سوار بمانید تا بتوانید با فاصله جانبی کافی و ایمن سبقت بگیرید.",
        "ps": "تر شا یې پاتې شئ تر څو په کافي اړخیز واټن او خوندي ډول ترې مخکې شئ."
      }
    }
  },
  {
    "lesson_number": 102,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Wanneer mag je groot licht gebruiken?",
        "fa": "چه زمانی می‌توانید از نور بالا استفاده کنید؟",
        "ps": "کله د موټر لوړ څراغ کارولای شئ؟"
      },
      "options": [
        {
          "nl": "In het donker, zolang je geen weggebruiker tegenkomt en niet vlak achter een ander voertuig rijdt.",
          "fa": "در تاریکی، اگر کسی از روبه‌رو نیاید و درست پشت وسیله نقلیه دیگری نباشید.",
          "ps": "په تیاره کې، که له مقابل لوري څوک نه راځي او بل موټر ته له شا نږدې نه یاست."
        },
        {
          "nl": "Overdag als je geen tegenliggers ziet.",
          "fa": "در روز، اگر کسی از روبه‌رو نیاید.",
          "ps": "د ورځې، که له مقابل لوري څوک نه راځي."
        },
        {
          "nl": "In het donker, ook vlak achter een ander voertuig.",
          "fa": "در تاریکی، حتی درست پشت وسیله نقلیه دیگر.",
          "ps": "په تیاره کې، حتی که د بل موټر تر شا ډېر نږدې یاست."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "In het donker, zolang je geen weggebruiker tegenkomt en niet vlak achter een ander voertuig rijdt.",
        "fa": "در تاریکی، اگر کسی از روبه‌رو نیاید و درست پشت وسیله نقلیه دیگری نباشید.",
        "ps": "په تیاره کې، که له مقابل لوري څوک نه راځي او بل موټر ته له شا نږدې نه یاست."
      }
    }
  }
]
$fixes$::jsonb) AS data(lesson_number integer, quiz jsonb)
), release AS (
  SELECT id FROM content_releases WHERE version = 1 AND status = 'published'
), repaired_lessons AS (
  UPDATE course_lessons AS l SET
    content_blocks = (
      SELECT jsonb_agg(CASE b.block->>'type'
        WHEN 'quiz' THEN f.quiz
        WHEN 'rule' THEN jsonb_set(b.block, '{text}', f.quiz->'explanation')
        ELSE b.block END ORDER BY b.position)
      FROM jsonb_array_elements(l.content_blocks) WITH ORDINALITY AS b(block, position)
    ),
    summary = f.quiz->'explanation',
    updated_at = now()
  FROM fixes AS f
  WHERE l.release_id = (SELECT id FROM release) AND l.lesson_number = f.lesson_number
  RETURNING l.lesson_number, l.release_id
), exam_fixes AS (
  SELECT l.release_id, 112 + ((l.lesson_number - 1) * 6) + v.variant AS number, v.variant, f.quiz
  FROM repaired_lessons AS l JOIN fixes AS f USING (lesson_number)
  CROSS JOIN (VALUES (1), (2), (4), (5), (6)) AS v(variant)
), repaired_exams AS (
  UPDATE exam_questions_v1 AS e SET
    prompt = CASE
      WHEN f.variant = 1 THEN f.quiz->'question'
      WHEN f.variant = 5 THEN jsonb_build_object(
        'nl', (f.quiz->'explanation'->>'nl') || ' Juist of onjuist?',
        'fa', (f.quiz->'explanation'->>'fa') || ' درست یا نادرست؟',
        'ps', (f.quiz->'explanation'->>'ps') || ' سمه ده که ناسمه؟')
      ELSE e.prompt END,
    options = CASE
      WHEN f.variant = 1 THEN f.quiz->'options'
      WHEN f.variant IN (2,4,6) THEN jsonb_set(e.options, '{0}', f.quiz->'explanation')
      ELSE e.options END,
    explanation = CASE WHEN f.variant IN (1,2,5,6) THEN f.quiz->'explanation' ELSE e.explanation END,
    updated_at = now()
  FROM exam_fixes AS f
  WHERE e.release_id = f.release_id AND e.external_key = 'cbr2026-q' || f.number
    AND (f.variant <> 5 OR e.correct_answer = '0'::jsonb)
  RETURNING e.external_key
), recorded AS (
  INSERT INTO schema_migrations(version, name)
  SELECT 49, 'clarify_turning_overtaking_and_high_beam' WHERE EXISTS (SELECT FROM repaired_lessons)
  ON CONFLICT (version) DO NOTHING
)
SELECT (SELECT count(*) FROM repaired_lessons) AS repaired_lessons,
       (SELECT count(*) FROM repaired_exams) AS repaired_exam_questions;
