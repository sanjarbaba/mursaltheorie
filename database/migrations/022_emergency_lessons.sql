-- Complete lessons 141-150 with bilingual emergency and breakdown rules.
BEGIN;
DO $do$
DECLARE i int; nums int[]:=ARRAY[141,142,143,144,145,146,147,148,149,150];
 rules text[]:=ARRAY['Bij een ongeval stop je veilig en help je zonder extra gevaar te veroorzaken.','Verleen eerste hulp als dat veilig kan en waarschuw hulpdiensten.','Blijf op afstand van gevaarlijke situaties zoals brand of lekkage.','Zet alarmlichten aan als je stilstaat en andere weggebruikers moet waarschuwen.','Volg aanwijzingen van hulpdiensten en maak ruimte.','Bij pech ga je zo snel mogelijk naar een veilige plaats.','Bel 112 bij direct gevaar, gewonden of een ernstig ongeval.','Maak ruimte voor ambulance, politie en brandweer.','Plaats een gevarendriehoek alleen als je dat veilig kunt doen.','Ga achter de vangrail of zo ver mogelijk van het verkeer staan.'];
 rulesfa text[]:=ARRAY['در تصادف ایمن توقف و بدون ایجاد خطر بیشتر کمک کنید.','اگر ایمن است کمک اولیه بدهید و نیروهای امدادی را خبر کنید.','از خطرهایی مانند آتش یا نشت فاصله بگیرید.','اگر متوقف و نیازمند هشدار هستید چراغ خطر را روشن کنید.','دستور نیروهای امدادی را دنبال و راه باز کنید.','در خرابی سریع به محل امن بروید.','در خطر فوری، مجروح یا تصادف شدید با ۱۱۲ تماس بگیرید.','برای آمبولانس، پلیس و آتش‌نشانی راه باز کنید.','مثلث هشدار را فقط اگر ایمن است قرار دهید.','پشت گاردریل یا تا حد ممکن دور از ترافیک بایستید.'];
 q text[]:=ARRAY['Wat doe je bij een ongeval?','Wanneer verleen je eerste hulp?','Waar blijf je bij brand of lekkage?','Wat doe je als je moet waarschuwen?','Wie volg je bij een incident?','Waar ga je heen bij pech?','Wanneer bel je 112?','Voor wie maak je ruimte?','Wanneer plaats je een gevarendriehoek?','Waar wacht je veilig?'];
 qfa text[]:=ARRAY['در تصادف چه می‌کنید؟','چه زمانی کمک اولیه می‌دهید؟','در آتش یا نشت کجا می‌ایستید؟','برای هشدار چه می‌کنید؟','در حادثه از چه کسی پیروی می‌کنید؟','در خرابی کجا می‌روید؟','چه زمانی با ۱۱۲ تماس می‌گیرید؟','برای چه کسی راه باز می‌کنید؟','چه زمانی مثلث هشدار می‌گذارید؟','کجا ایمن منتظر می‌مانید؟'];
BEGIN
 FOR i IN 1..10 LOOP
  UPDATE course_lessons l SET summary=jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),content_blocks=jsonb_build_array(jsonb_build_object('type','rule','text',jsonb_build_object('nl',rules[i],'fa',rulesfa[i])),jsonb_build_object('type','exam_tip','text',jsonb_build_object('nl','Eigen veiligheid en die van anderen staat altijd voorop.','fa','ایمنی خود و دیگران همیشه اولویت دارد.')),jsonb_build_object('type','quiz','question',jsonb_build_object('nl',q[i],'fa',qfa[i]),'options',jsonb_build_array(jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),jsonb_build_object('nl','Doorrijden zonder kijken','fa','بدون نگاه ادامه دادن'),jsonb_build_object('nl','Gevaar negeren','fa','نادیده گرفتن خطر')),'correctOption',0,'explanation',jsonb_build_object('nl',rules[i],'fa',rulesfa[i]))),updated_at=NOW() WHERE l.release_id=(SELECT id FROM content_releases WHERE version=1) AND l.lesson_number=nums[i];
 END LOOP;
END $do$;
INSERT INTO schema_migrations(version,name) VALUES(22,'emergency_lessons') ON CONFLICT(version) DO NOTHING;
COMMIT;

