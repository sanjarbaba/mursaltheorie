# Wereld 2 — Voorrang

Uitbreiding van Mursal Theory Hero, 16 september 2026.

## Spelen

Open `/game/spelen`, log in met je bestaande Mursaltheorie-account en voltooi Wereld 1. Na de Bordenbaas verschijnt **Ontdek Wereld 2**. Via **Werelden** kun je tussen beide werelden wisselen.

Wereld 2 bevat twintig levels, 32 inhoudelijke situaties en vier hoofdstukken. Spelvormen: situatie beoordelen, volgorde kiezen, de passende regel kiezen en challenges van 25 seconden per vraag. De klok kan uit via Mijn held. De mini-boss staat op level 10 en de eindbaas op level 20. De eindbeloning is de Voorrangsheld-badge.

De vijf levens worden gedeeld tussen de werelden. Bij nul levens krijg je vijf bonusvragen uit de basis van je geselecteerde wereld. Beantwoord ze allemaal goed voor vijf nieuwe levens. Herkansingen kosten geen levens en geven geen XP. De bestaande toegang van 30 dagen omvat beide werelden.

## Data en opslag

- `api/v1/_priority-data.js`: situaties, bronverwijzingen, hoofdstukken en leveldefinities.
- `api/v1/_game-data.js`: gecombineerd wereldregister en vraagopbouw. `WORLD_CONFIG` bevat namen, badges, begin/eindlevel en hoofdstukken.
- `game/priority-view.js`: schematische kruispunten en situatiekaarten. De tekst geeft de volledige voorwaarden; tekeningen verbergen geen aanvullende regels.
- `game/engine.js`: badges per wereld, ontgrendeling, scores en save-migratie.

Wereld 1 behoudt ID’s 1–20. Wereld 2 gebruikt 21–40 en toont aan spelers de nummers 1–20. De bestaande opslagsleutel en saveversie blijven behouden. Badges worden bij laden opnieuw afgeleid uit de behaalde levels. Bestaande XP en sterren blijven intact. Toekomstige werelden krijgen nieuwe ID’s en een entry in het wereldregister; bestaande ID’s blijven gelijk.

## Bronnen

Het officiële RVV, versie 1 juli 2026, is opgehaald en inhoudelijk gecontroleerd op 16 september 2026. Artikelen 15, 18, 49, 54, 64 en 80 onderbouwen de nieuwe vragen. Voor B6, B7 en D1 wordt de bestaande bron voor Bijlage 1 gebruikt. Elke vraag verwijst naar zijn eigen artikel of bordbron. De regels en uitleg zijn in eigen woorden geschreven. Er is geen CBR-samenwerking.

## Controle

`node --test test/mursal-game.test.mjs test/world2.test.mjs test/comeback.test.mjs test/game-access.test.mjs`

Alle twintig nieuwe levels zijn met browserknoppen voltooid, inclusief een fout antwoord met uitleg, hervatten na herladen en beide bazen zonder powers. De overgang vanuit de laatste Wereld-1-boss, tweede badge, naslagboek en beide wereldpaden zijn gecontroleerd. De laatste assertion van de eerste browserrun las vóór de schermwissel; gericht opnieuw gecontroleerd met wachten op het nieuwe scherm. Wereld 2-comeback ook afzonderlijk via de interface voltooid.

Mobiel getest op 390px en desktop op 1440px in Edge. Betaalde toegang is in deze speltests nagebootst; geen echte aankoop uitgevoerd. De live anonieme toegangscontrole wordt na Vercel-publicatie opnieuw gecontroleerd.

Na wijzigingen: `node scripts/build-game-offline.mjs`. De beschermde API-inhoud wordt niet door de PWA gecachet. Internet blijft vereist voor de abonnementscontrole.
