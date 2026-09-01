import fs from 'node:fs';
import vm from 'node:vm';

const sourcePath = new URL('../learn5.source.html', import.meta.url);
const outputPath = new URL('../database/migrations/003_seed_learn5_content.sql', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');

function literal(name, opener = '[', closer = ']') {
  const marker = `const ${name}=`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${name}`);
  const valueStart = source.indexOf(opener, start + marker.length);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = valueStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    else if (char === opener) depth += 1;
    else if (char === closer && --depth === 0) {
      const code = source.slice(valueStart, index + 1);
      if (/[`;]|\b(function|new|class|import|require|process|globalThis)\b/.test(code)) {
        throw new Error(`Unsafe syntax in ${name}`);
      }
      return vm.runInNewContext(`(${code})`, Object.create(null), {
        timeout: 100,
        contextCodeGeneration: { strings: false, wasm: false }
      });
    }
  }
  throw new Error(`Unterminated ${name}`);
}

const modulesNl = literal('MOD');
const moduleFa = literal('FM');
const lessonsFa = literal('FA_LESSONS');
const questionsNl = literal('Q');
const questionsFa = literal('FA_Q');
const providedImages = literal('PROVIDED_IMG', '{', '}');
const lessonImages = literal('LESSON_IMG', '{', '}');

function slug(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' en ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sceneKind(text) {
  const value = text.toLowerCase();
  const tests = [
    ['zebra', ['zebra', 'voetganger']], ['stop', ['stopbord', 'stop bord']],
    ['priority', ['haaient', 'voorrang']], ['roundabout', ['rotonde']],
    ['merge', ['invoeg', 'uitvoeg', 'rijstrook']], ['rain', ['regen', 'aquaplan']],
    ['mist', ['mist']], ['bike', ['fiet', 'dode hoek']], ['ambulance', ['ambulance', '112']],
    ['parking', ['park', 'stilstaan']], ['phone', ['smartphone', 'telefoon']],
    ['tyre', ['band']], ['light', ['licht']], ['speed', ['snelheid', '50', '80', '100']],
    ['distance', ['afstand', 'remweg', 'stopafstand']], ['intersection', ['kruispunt', 'afslaan']],
    ['children', ['kind', 'school']]
  ];
  return tests.find(([, words]) => words.some((word) => value.includes(word)))?.[0] || 'intersection';
}

const rules = {
  priority: 'Controleer eerst verkeerslichten, aanwijzingen, borden en haaientanden.',
  roundabout: 'Pas je snelheid aan, kijk naar verkeer op de rotonde en geef richting aan bij het verlaten.',
  merge: 'Kijk in spiegels en dode hoek, pas snelheid aan en verplaats pas als er ruimte is.',
  distance: 'Houd voldoende afstand en pas je snelheid aan aan zicht, wegdek en verkeer.',
  zebra: 'Let vroeg op voetgangers en voorkom dat je een oversteekplaats blokkeert.',
  parking: 'Controleer borden, afstand tot kruisingen en of je geen gevaar of hinder veroorzaakt.',
  bike: 'Controleer extra goed de dode hoek en houd voldoende zijafstand.',
  rain: 'Verminder snelheid en vergroot de volgafstand.', mist: 'Pas snelheid aan het zicht aan en gebruik verlichting volgens de omstandigheden.',
  phone: 'Laat je telefoon tijdens het rijden met rust.', tyre: 'Controleer banden regelmatig op profiel, spanning en beschadiging.',
  light: 'Gebruik de juiste verlichting voor zicht en omstandigheden.', speed: 'Volg de geldende limiet en kies altijd een veilige snelheid.',
  ambulance: 'Geef hulpdiensten veilig en voorspelbaar ruimte.', children: 'Verlaag snelheid en houd rekening met onverwacht gedrag.',
  intersection: 'Kijk naar alle richtingen en bepaal eerst wie voorrang heeft.'
};

const sceneImages = {
  zebra: '/images/Voetganger nadert zebrapad, auto stopt.jpg', stop: '/images/Blauwe auto nadert stopbord.jpg',
  priority: '/images/Kruispunt met haaientanden en voorrangsbord.jpg', roundabout: '/images/Rotonde verlaten met rechter richtingaanwijzer.jpg',
  merge: '/images/Veilig invoegen vanaf de acceleratiestrook.jpg', distance: '/images/Reactie en remweg bij een obstakel.jpg',
  rain: '/images/Grote volgafstand in zware regen.jpg', mist: '/images/Mistachterlicht bij 50 meter zicht.jpg',
  bike: '/images/Dode hoek_ twee fietsposities naast vrachtwagen.jpg', ambulance: '/images/Veilig ruimte maken voor de ambulance.jpg',
  parking: '/images/Parkeerafstand bij de hoek_ 5 meter.jpg', phone: '/images/Geen smartphone tijdens het rijden.jpg',
  tyre: '/images/Bandprofiel meten_ 1,6 mm.jpg', light: '/images/Dimlicht zonder verblinding.jpg',
  speed: '/images/Blauwe auto bij 50-km-bord.jpg', intersection: "/images/Twee auto's rechtdoor op gelijkwaardig kruispunt.jpg",
  children: '/images/Langzaam rijden langs spelende kinderen.jpg'
};

function imageFor(title, id) {
  if (providedImages[id]) return providedImages[id];
  if (lessonImages[id]) return `/images/${lessonImages[id]}.webp`;
  return sceneImages[sceneKind(title)];
}

const modules = modulesNl.map((items, index) => ({
  moduleNumber: index + 1, slug: slug(items[0]), title: { nl: items[0], fa: moduleFa[index] }, sortOrder: index + 1
}));

const lessons = modulesNl.flatMap((items, moduleIndex) => items.slice(1).map((title, lessonIndex) => {
  const id = moduleIndex * 10 + lessonIndex + 1;
  const category = sceneKind(title);
  return {
    lessonNumber: id, moduleNumber: moduleIndex + 1, slug: `${String(id).padStart(3, '0')}-${slug(title)}`,
    title: { nl: title, fa: lessonsFa[moduleIndex][lessonIndex] },
    summary: { nl: rules[category], fa: 'اول تمام وضعیت ترافیک، علایم و خطر را بررسی کنید و سپس طبق قانون عمل کنید.' },
    contentBlocks: [{ type: 'rule', text: { nl: rules[category], fa: 'اول تمام وضعیت ترافیک، علایم و خطر را بررسی کنید و سپس طبق قانون عمل کنید.' } },
      { type: 'exam_tip', text: { nl: 'Kijk altijd naar borden, markering, positie, andere weggebruikers en mogelijk gevaar.', fa: 'همیشه علایم، خط‌کشی، موقعیت، کاربران دیگر و خطر احتمالی را ببینید.' } }],
    media: [{ type: 'image', src: imageFor(title, id), alt: { nl: title, fa: lessonsFa[moduleIndex][lessonIndex] } }],
    estimatedMinutes: 4, sortOrder: lessonIndex + 1
  };
}));

const questions = questionsNl.map((question, index) => ({
  externalKey: `learn5-q${String(index + 1).padStart(2, '0')}`,
  prompt: { nl: question[0], fa: questionsFa[index][0] },
  options: question[1].map((option, optionIndex) => ({ nl: option, fa: questionsFa[index][1][optionIndex] })),
  correctOption: question[2], category: question[3],
  explanation: { nl: 'Bekijk de verkeerssituatie opnieuw en kies het antwoord dat veilig en volgens de verkeersregels is.', fa: 'وضعیت ترافیک را دوباره ببینید و پاسخی را انتخاب کنید که ایمن و مطابق قانون باشد.' },
  media: [{ type: 'image', src: sceneImages[question[3]] || sceneImages.intersection }]
}));

const exams = Array.from({ length: 30 }, (_, index) => ({
  examNumber: index + 1, title: { nl: `Oefenexamen ${index + 1}`, fa: `امتحان تمرینی ${index + 1}` },
  questionCount: 30, passScore: 88, durationSeconds: 1800,
  questionKeys: Array.from({ length: 30 }, (_, position) => questions[(position * 7 + (index + 1) * 3) % questions.length].externalKey)
}));

function json(value) { return JSON.stringify(value).replaceAll('$content$', '$ content $'); }
const sql = `BEGIN;

INSERT INTO content_releases (version, status, notes, published_at)
VALUES (1, 'draft', 'Geëxtraheerd uit learn5.html', NULL)
ON CONFLICT (version) DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW();

WITH release AS (SELECT id FROM content_releases WHERE version = 1),
data AS (SELECT * FROM jsonb_to_recordset($content$${json(modules)}$content$::jsonb)
  AS x("moduleNumber" int, slug text, title jsonb, "sortOrder" int))
INSERT INTO course_modules (release_id, module_number, slug, title, description, sort_order, published)
SELECT release.id, data."moduleNumber", data.slug, data.title, '{}'::jsonb, data."sortOrder", TRUE FROM release, data
ON CONFLICT (release_id, module_number) DO UPDATE SET slug=EXCLUDED.slug, title=EXCLUDED.title,
  sort_order=EXCLUDED.sort_order, published=TRUE, updated_at=NOW();

WITH release AS (SELECT id FROM content_releases WHERE version = 1),
data AS (SELECT * FROM jsonb_to_recordset($content$${json(lessons)}$content$::jsonb)
  AS x("lessonNumber" int, "moduleNumber" int, slug text, title jsonb, summary jsonb, "contentBlocks" jsonb,
    media jsonb, "estimatedMinutes" smallint, "sortOrder" int))
INSERT INTO course_lessons (lesson_number, module_id, release_id, slug, title, summary, content_blocks, media, estimated_minutes, sort_order, published)
SELECT data."lessonNumber", module.id, release.id, data.slug, data.title, data.summary, data."contentBlocks", data.media,
  data."estimatedMinutes", data."sortOrder", TRUE
FROM release, data JOIN course_modules module ON module.module_number=data."moduleNumber" AND module.release_id=(SELECT id FROM release)
ON CONFLICT (release_id, lesson_number) DO UPDATE SET module_id=EXCLUDED.module_id, slug=EXCLUDED.slug, title=EXCLUDED.title,
  summary=EXCLUDED.summary, content_blocks=EXCLUDED.content_blocks, media=EXCLUDED.media,
  estimated_minutes=EXCLUDED.estimated_minutes, sort_order=EXCLUDED.sort_order, published=TRUE, updated_at=NOW();

WITH release AS (SELECT id FROM content_releases WHERE version = 1),
data AS (SELECT * FROM jsonb_to_recordset($content$${json(questions)}$content$::jsonb)
  AS x("externalKey" text, prompt jsonb, options jsonb, "correctOption" smallint, category text, explanation jsonb, media jsonb))
INSERT INTO exam_questions_v1 (release_id, external_key, prompt, options, explanation, correct_option, category, media, published)
SELECT release.id, data."externalKey", data.prompt, data.options, data.explanation, data."correctOption", data.category, data.media, TRUE FROM release, data
ON CONFLICT (release_id, external_key) DO UPDATE SET prompt=EXCLUDED.prompt, options=EXCLUDED.options,
  explanation=EXCLUDED.explanation, correct_option=EXCLUDED.correct_option, category=EXCLUDED.category,
  media=EXCLUDED.media, published=TRUE, updated_at=NOW();

WITH release AS (SELECT id FROM content_releases WHERE version = 1),
data AS (SELECT * FROM jsonb_to_recordset($content$${json(exams)}$content$::jsonb)
  AS x("examNumber" int, title jsonb, "questionCount" smallint, "passScore" smallint, "durationSeconds" int, "questionKeys" jsonb))
INSERT INTO exam_definitions (release_id, exam_number, title, question_count, pass_score, duration_seconds, published)
SELECT release.id, data."examNumber", data.title, data."questionCount", data."passScore", data."durationSeconds", TRUE FROM release, data
ON CONFLICT (release_id, exam_number) DO UPDATE SET title=EXCLUDED.title, question_count=EXCLUDED.question_count,
  pass_score=EXCLUDED.pass_score, duration_seconds=EXCLUDED.duration_seconds, published=TRUE, updated_at=NOW();

WITH release AS (SELECT id FROM content_releases WHERE version = 1),
data AS (SELECT * FROM jsonb_to_recordset($content$${json(exams)}$content$::jsonb)
  AS x("examNumber" int, title jsonb, "questionCount" smallint, "passScore" smallint, "durationSeconds" int, "questionKeys" jsonb)),
links AS (SELECT data."examNumber", key.value AS external_key, key.ordinality::smallint AS sort_order
  FROM data CROSS JOIN LATERAL jsonb_array_elements_text(data."questionKeys") WITH ORDINALITY AS key(value, ordinality))
INSERT INTO exam_definition_questions_v1 (exam_id, question_id, sort_order)
SELECT exam.id, question.id, links.sort_order FROM links
JOIN release ON TRUE JOIN exam_definitions exam ON exam.release_id=release.id AND exam.exam_number=links."examNumber"
JOIN exam_questions_v1 question ON question.release_id=release.id AND question.external_key=links.external_key
ON CONFLICT (exam_id, question_id) DO UPDATE SET sort_order=EXCLUDED.sort_order;

UPDATE content_releases SET status='published', published_at=COALESCE(published_at, NOW()), updated_at=NOW() WHERE version=1;
INSERT INTO schema_migrations (version, name) VALUES (3, 'seed_learn5_content') ON CONFLICT (version) DO NOTHING;
COMMIT;
`;

if (modules.length !== 15 || lessons.length !== 150 || questions.length !== 30 || exams.some((exam) => new Set(exam.questionKeys).size !== 30)) {
  throw new Error('Content invariants failed');
}
fs.writeFileSync(outputPath, sql);
console.log(JSON.stringify({ modules: modules.length, lessons: lessons.length, questions: questions.length, exams: exams.length, bytes: sql.length }));
