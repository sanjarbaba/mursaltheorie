-- Replace reviewed questions as complete sets to avoid offsets between questions and options.
-- Existing question IDs, answer positions, and exam links are preserved.
WITH fixes AS (
  SELECT * FROM jsonb_to_recordset($fixes$
[
  {
    "lesson_number": 74,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Mag je op een zebrapad parkeren?",
        "fa": "آیا می‌توانید روی خط عابر پیاده پارک کنید؟",
        "ps": "ایا د پلي تېرېدو پر کرښو پارک کولای شئ؟"
      },
      "options": [
        {
          "nl": "Nee, ook kort vrijwillig stilstaan is daar verboden.",
          "fa": "نه، حتی توقف کوتاه اختیاری در آنجا ممنوع است.",
          "ps": "نه، هلته په خپله خوښه لنډ درېدل هم منع دي."
        },
        {
          "nl": "Ja, als er geen voetgangers zijn.",
          "fa": "بله، اگر عابر پیاده نباشد.",
          "ps": "هو، که پلي کسان نه وي."
        },
        {
          "nl": "Ja, met de alarmlichten aan.",
          "fa": "بله، با چراغ‌های هشدار روشن.",
          "ps": "هو، که بیړني څراغونه بل وي."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Nee, ook kort vrijwillig stilstaan is daar verboden.",
        "fa": "نه، حتی توقف کوتاه اختیاری در آنجا ممنوع است.",
        "ps": "نه، هلته په خپله خوښه لنډ درېدل هم منع دي."
      }
    }
  },
  {
    "lesson_number": 75,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Mag je bij een bushalte op de geblokte markering parkeren?",
        "fa": "آیا می‌توانید روی خط‌کشی شطرنجی ایستگاه بس پارک کنید؟",
        "ps": "ایا د بس تمځي پر بلاکي نښه موټر پارک کولای شئ؟"
      },
      "options": [
        {
          "nl": "Nee, houd de gemarkeerde halte vrij.",
          "fa": "نه، بخش علامت‌گذاری‌شده ایستگاه را آزاد بگذارید.",
          "ps": "نه، د تمځي نښه شوې برخه تشه پرېږدئ."
        },
        {
          "nl": "Ja, als er geen bus aankomt.",
          "fa": "بله، اگر بسی در حال نزدیک‌شدن نباشد.",
          "ps": "هو، که بس نه راځي."
        },
        {
          "nl": "Ja, buiten de spits.",
          "fa": "بله، بیرون از ساعات شلوغی.",
          "ps": "هو، له ګڼې ګوڼې ساعتونو بهر."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Nee, houd de gemarkeerde halte vrij.",
        "fa": "نه، بخش علامت‌گذاری‌شده ایستگاه را آزاد بگذارید.",
        "ps": "نه، د تمځي نښه شوې برخه تشه پرېږدئ."
      }
    }
  },
  {
    "lesson_number": 76,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Mag je je personenauto op een gewone stoep parkeren?",
        "fa": "آیا می‌توانید موتر سواری را روی پیاده‌روی معمولی پارک کنید؟",
        "ps": "ایا شخصي موټر پر عادي پلې لار پارک کولای شئ؟"
      },
      "options": [
        {
          "nl": "Nee, een gewone stoep is bestemd voor voetgangers.",
          "fa": "نه، پیاده‌روی معمولی برای عابران پیاده است.",
          "ps": "نه، عادي پلې لار د پلي کسانو لپاره ده."
        },
        {
          "nl": "Ja, als je twee wielen op de rijbaan laat staan.",
          "fa": "بله، اگر دو چرخ روی سواره‌رو بماند.",
          "ps": "هو، که دوه ټایرونه پر سړک پاتې شي."
        },
        {
          "nl": "Ja, zolang je kort wegblijft.",
          "fa": "بله، اگر برای مدت کوتاه دور بمانید.",
          "ps": "هو، که یوازې د لږ وخت لپاره لاړ شئ."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Nee, een gewone stoep is bestemd voor voetgangers.",
        "fa": "نه، پیاده‌روی معمولی برای عابران پیاده است.",
        "ps": "نه، عادي پلې لار د پلي کسانو لپاره ده."
      }
    }
  },
  {
    "lesson_number": 77,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Wat gebruik je om tijdens de aangegeven uren met je auto bij een blauwe streep te parkeren?",
        "fa": "برای پارک موتر کنار خط آبی در ساعات مشخص‌شده از چه استفاده می‌کنید؟",
        "ps": "په ټاکلو ساعتونو کې د آبي کرښې ترڅنګ د پارک لپاره څه کاروئ؟"
      },
      "options": [
        {
          "nl": "Een goed zichtbare parkeerschijf met de aankomsttijd.",
          "fa": "دیسک پارک که دیده شود و زمان رسیدن را نشان دهد.",
          "ps": "د پارک داسې ډیسک چې ښکاره وي او د راتګ وخت وښيي."
        },
        {
          "nl": "Een parkeerkaartje van een betaalautomaat.",
          "fa": "بلیط پارک از دستگاه پرداخت.",
          "ps": "د پیسو ماشین د پارک ټکټ."
        },
        {
          "nl": "Een briefje met alleen je kenteken.",
          "fa": "برگه‌ای که فقط شماره پلاک روی آن است.",
          "ps": "یوه پاڼه چې یوازې د موټر نمبر پرې لیکل شوی وي."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Een goed zichtbare parkeerschijf met de aankomsttijd.",
        "fa": "دیسک پارک که دیده شود و زمان رسیدن را نشان دهد.",
        "ps": "د پارک داسې ډیسک چې ښکاره وي او د راتګ وخت وښيي."
      }
    }
  },
  {
    "lesson_number": 78,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Wanneer mag je je auto op een algemene gehandicaptenparkeerplaats parkeren?",
        "fa": "چه زمانی می‌توانید موتر را در جای پارک عمومی افراد دارای معلولیت پارک کنید؟",
        "ps": "کله خپل موټر د معلولیت لرونکو کسانو په عمومي پارک ځای کې درولای شئ؟"
      },
      "options": [
        {
          "nl": "Als je recht hebt op het gebruik van een geldige gehandicaptenparkeerkaart en die duidelijk zichtbaar neerlegt.",
          "fa": "وقتی مجاز به استفاده از کارت معتبر پارک افراد دارای معلولیت هستید و آن را در جای قابل دید قرار می‌دهید.",
          "ps": "کله چې د معلولیت لرونکو کسانو د پارک معتبر کارت د کارولو حق لرئ او کارت ښکاره ږدئ."
        },
        {
          "nl": "Als je maar een paar minuten wegblijft.",
          "fa": "اگر فقط چند دقیقه دور می‌مانید.",
          "ps": "که یوازې د څو دقیقو لپاره لاړ شئ."
        },
        {
          "nl": "Als je de alarmlichten aanzet.",
          "fa": "اگر چراغ‌های هشدار را روشن کنید.",
          "ps": "که بیړني څراغونه بل کړئ."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Als je recht hebt op het gebruik van een geldige gehandicaptenparkeerkaart en die duidelijk zichtbaar neerlegt.",
        "fa": "وقتی مجاز به استفاده از کارت معتبر پارک افراد دارای معلولیت هستید و آن را در جای قابل دید قرار می‌دهید.",
        "ps": "کله چې د معلولیت لرونکو کسانو د پارک معتبر کارت د کارولو حق لرئ او کارت ښکاره ږدئ."
      }
    }
  },
  {
    "lesson_number": 86,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Boven jouw rijstrook brandt een rood kruis. Wat doe je?",
        "fa": "بالای خط عبور شما ضربدر سرخ روشن است. چه می‌کنید؟",
        "ps": "ستاسو د تګ د لین پر سر سور ضربدر بل دی. څه کوئ؟"
      },
      "options": [
        {
          "nl": "Verlaat die rijstrook zo snel als dat veilig kan; de rijstrook is gesloten.",
          "fa": "به محض اینکه ایمن باشد آن خط را ترک کنید؛ خط بسته است.",
          "ps": "لین ژر تر ژره په خوندي ډول پرېږدئ؛ دا لین تړلی دی."
        },
        {
          "nl": "Blijf op de rijstrook en verminder alleen je snelheid.",
          "fa": "در همان خط بمانید و فقط سرعت را کم کنید.",
          "ps": "پر هماغه لین پاتې شئ او یوازې سرعت کم کړئ."
        },
        {
          "nl": "Blijf rijden tot je een tweede rood kruis ziet.",
          "fa": "تا دیدن ضربدر سرخ دوم به رانندگی ادامه دهید.",
          "ps": "تر دویم سور ضربدر پورې په لین کې روان اوسئ."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Verlaat die rijstrook zo snel als dat veilig kan; de rijstrook is gesloten.",
        "fa": "به محض اینکه ایمن باشد آن خط را ترک کنید؛ خط بسته است.",
        "ps": "لین ژر تر ژره په خوندي ډول پرېږدئ؛ دا لین تړلی دی."
      }
    }
  },
  {
    "lesson_number": 96,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Welke basisverlichting gebruik je als je in het donker rijdt?",
        "fa": "هنگام رانندگی در تاریکی از کدام چراغ اصلی استفاده می‌کنید؟",
        "ps": "په تیاره کې د موټر چلولو پر مهال کوم اساسي څراغ کاروئ؟"
      },
      "options": [
        {
          "nl": "Dimlicht; dagrijlicht alleen is onvoldoende.",
          "fa": "چراغ نور پایین؛ چراغ روز به‌تنهایی کافی نیست.",
          "ps": "ټیټ څراغ؛ یوازې د ورځې څراغ بسنه نه کوي."
        },
        {
          "nl": "Alleen dagrijlicht.",
          "fa": "فقط چراغ روز.",
          "ps": "یوازې د ورځې څراغ."
        },
        {
          "nl": "Alleen stadslicht.",
          "fa": "فقط چراغ کوچک.",
          "ps": "یوازې واړه څراغونه."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Dimlicht; dagrijlicht alleen is onvoldoende.",
        "fa": "چراغ نور پایین؛ چراغ روز به‌تنهایی کافی نیست.",
        "ps": "ټیټ څراغ؛ یوازې د ورځې څراغ بسنه نه کوي."
      }
    }
  },
  {
    "lesson_number": 118,
    "quiz": {
      "type": "quiz",
      "question": {
        "nl": "Een voetganger met een witte stok met rode ringen wil oversteken. Wat doe je?",
        "fa": "عابر پیاده با عصای سفید دارای حلقه‌های سرخ می‌خواهد عبور کند. چه می‌کنید؟",
        "ps": "یو پلی کس له سپینې امسا او سرو کړیو سره غواړي واوړي. څه کوئ؟"
      },
      "options": [
        {
          "nl": "Laat de voetganger voorgaan en geef voldoende tijd om over te steken.",
          "fa": "به عابر اجازه دهید ابتدا عبور کند و وقت کافی بدهید.",
          "ps": "پلي کس ته د لومړي تېرېدو اجازه او کافي وخت ورکړئ."
        },
        {
          "nl": "Rijd door en wacht tot de voetganger oogcontact maakt.",
          "fa": "به حرکت ادامه دهید تا عابر به شما نگاه کند.",
          "ps": "موټر ته دوام ورکړئ تر څو پلی کس درته وګوري."
        },
        {
          "nl": "Laat de voetganger alleen bij een zebrapad voorgaan.",
          "fa": "فقط در گذرگاه خط‌کشی‌شده به عابر اجازه عبور بدهید.",
          "ps": "یوازې د پلي تېرېدو پر کرښو پلي کس ته لومړیتوب ورکړئ."
        }
      ],
      "correctOption": 0,
      "explanation": {
        "nl": "Laat de voetganger voorgaan en geef voldoende tijd om over te steken.",
        "fa": "به عابر اجازه دهید ابتدا عبور کند و وقت کافی بدهید.",
        "ps": "پلي کس ته د لومړي تېرېدو اجازه او کافي وخت ورکړئ."
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
  SELECT 48, 'repair_misaligned_lesson_questions' WHERE EXISTS (SELECT FROM repaired_lessons)
  ON CONFLICT (version) DO NOTHING
)
SELECT (SELECT count(*) FROM repaired_lessons) AS repaired_lessons,
       (SELECT count(*) FROM repaired_exams) AS repaired_exam_questions;
