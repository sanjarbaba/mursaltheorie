# Mursal Theory Hero – Complete Game v1

Een Nederlandstalige webgame/PWA. **Productie: https://www.mursaltheorie.nl/game/spelen — inbegrepen bij een betaald digitaal pakket, 30 dagen toegang.** Deze map bevat daarnaast een besloten ontwikkelpreview; publiceer `dist` niet als vrij toegankelijke game. **Wereld 1: Verkeersborden en Wereld 2: Voorrang zijn speelbaar, elk met 20 levels.** De zes volgende werelden en de finale Theorie Examen zijn aangekondigde uitbreidingen, nog niet speelbaar.

## Direct starten

Vereist: Node.js 20 of hoger. Voor de lokale ontwikkelpreview zijn geen API-sleutels nodig. De productie-integratie gebruikt de bestaande Clerk-accounts en Neon-abonnementen van Mursaltheorie.

```sh
node server.mjs
```

Open **http://localhost:4173**. Dezelfde opdracht werkt op Windows, macOS en Linux. Of gebruik `npm start`. Open niet rechtstreeks `index.html`: modules en PWA-opslag hebben een webserver nodig.

Voor een andere poort stel je `PORT` in. De testserver luistert op alle netwerkinterfaces; voor PWA-installatie gebruik je localhost of een HTTPS-site. Een gewoon HTTP-adres op je lokale netwerk ondersteunt niet alle PWA-functies op een telefoon.

## Wat je kunt spelen

- 40 oplopende levels in twee werelden; 27 officiële verkeersborden en 32 voorrangssituaties. Wereld 2 ontgrendelt na Wereld 1.
- Bord herkennen, het passende bord kiezen, borden sorteren, timed challenges, schematische verkeerssituaties en een geheugenronde.
- Mini-boss De Poortwachter op level 10; De Bordenbaas op level 20.
- XP, maximaal 60 sterren, levelontgrendeling, vijf energiepunten en de virtuele Bordenheld-badge.
- Verkeersvisie geeft kijktips. Focus Shield beschermt één energiepunt maar wist geen fout. Kennisboost verdubbelt XP voor drie goede antwoorden. Elke power eenmaal per ronde; geen powers bij bazen.
- Fouten en verlopen tijd krijgen uitleg en een bronlink. Meestal is 60% goed nodig, bij beide bazen 80%.
- Alles goed geeft drie sterren; minimaal 80% twee sterren; een overige geslaagde ronde één ster. Alleen verbetering van de beste XP-score van een level voegt XP toe. Herhaling verlaagt je beste sterren niet.
- Bij nul levens stopt de ronde. De comeback-challenge stelt vijf bonusvragen: elke vraag moet goed beantwoord worden. Foute antwoorden krijgen uitleg en een herkansing. Na de vijfde goede vraag krijg je vijf levens terug; geen XP of ontgrendeling. Wachten of voortgang resetten geeft geen levens terug. Gewoon oefenen herstelt geen levens.
- Klok uitschakelen via **Mijn held → Zonder tijdsdruk**. Een onderbroken ronde is te hervatten; bij verlaten van het tabblad pauzeert de klok.

## PWA en lokale voortgang

Open de game eenmaal online zodat alle bestanden worden opgeslagen. Gebruik daarna **Installeer de game** of de installatieoptie van Chrome/Edge. Op iPhone/iPad: Safari → Delen → Zet op beginscherm. Installatieknoppen verschillen per browser.

De service worker bewaart alle spelbestanden, borden en Mursal lokaal. Er zijn geen externe lettertypen of externe afbeeldingen nodig. De cache heeft een inhoudsafhankelijke versie. Na bronwijzigingen:

```sh
node scripts/build-offline.mjs
```

Voortgang gebruikt `localStorage`, sleutel `mursal-theory-hero.v1`. Gebruik dezelfde browser en hetzelfde webadres. In productie krijgt iedere account een eigen lokale sleutel met het Clerk-gebruikers-ID. Er is geen synchronisatie tussen apparaten. Wissen van browsergegevens wist ook de voortgang. Als opslag niet beschikbaar is, verschijnt een duidelijke waarschuwing. **Mijn held → Voortgang opnieuw beginnen** vraagt bevestiging voordat het spel opnieuw begint.

## Projectstructuur en uitbreiden

| Bestand | Verantwoordelijkheid |
| --- | --- |
| `dist/data/worlds.js` | Wereld- en levelregister, vragen, spelvormen, uitleg en bronverwijzingen |
| `dist/data/official-signs.json` | Bordcodes, officiële omschrijvingen en exacte bron-URL per afbeelding |
| `dist/engine.js` | Score, energie, powers, saveversie, ontgrendeling en spelrondes |
| `dist/app.js` | Nederlandstalige interface, schermen, timer, bediening en lokale opslag |
| `dist/styles.css` | Responsive vormgeving en toegankelijkheid |
| `dist/manifest.webmanifest`, `dist/sw.js` | Installatie en offline gedrag |
| `scripts/build-offline.mjs` | Herbouw van het offline bestandsregister en de cacheversie |
| `tests/` | Spelregels en browserflows |

Nieuwe inhoud wordt toegevoegd via `WORLDS`, `LEVELS`, `SIGNS` en scenario's, met een eigen `worldId` en bronverwijzingen. De vraagopbouw staat los van de score-engine. Wereld 1 gebruikt ID’s 1–20, Wereld 2 gebruikt 21–40. WORLD_CONFIG bepaalt hoofdstukken, namen en wereldbadges. Bij een volgende wereld: maak de ontgrendeling en badgeberekening wereldspecifiek, vervang de huidige Wereld-1-tellers in de interface en voeg een migratie toe als de savevorm verandert. Bestaande level-ID's niet hernummeren.

## Broncontrole

Inhoudseditie: **16 september 2026**. Primaire bron: RVV 1990, geldend vanaf **1 juli 2026**.

- [RVV 1990 en Bijlage 1](https://wetten.overheid.nl/BWBR0004825/2026-07-01/#Bijlage1).
- [Rijksoverheid: welke verkeersborden en verkeersregels gelden?](https://www.rijksoverheid.nl/vraag-en-antwoord/verkeersveiligheid/welke-verkeersborden-en-verkeersregels-gelden-in-nederland).

Het officiële document is tijdens de bouw opgehaald en de 27 gebruikte borden zijn op code en omschrijving gecontroleerd. Situaties verwijzen waar nodig naar de artikelen 1, 54, 62, 63, 64, 67 en 79. In `SOURCES` staan versie, controledatum, uitgever en URL. Bij wijzigingen eerst de wettelijke bron vergelijken, dan uitleg/vragen bijwerken, tests uitvoeren en de offline build opnieuw maken. Er is geen automatische juridische actualisering.

Verkeersafbeeldingen komen uit de officiële RVV-bijlage. Mursal is een frame uit de door de eigenaar aangeleverde referentievideo. De game gebruikt geen CBR-branding en claimt geen officiële samenwerking. De badge is geen rijbewijs of examencertificaat.

## Testen

```sh
node --test tests/engine.test.mjs tests/comeback.test.mjs
node --check dist/app.js
node --check dist/engine.js
node --check dist/data/worlds.js
```

De browsertest vereist Playwright en Edge (of een Chromium-browser via aanpassing van `BROWSER_CHANNEL`). Start eerst de server. Installeer zo nodig Playwright met `npm install --no-save playwright` en voer uit:

```sh
node tests/browser.cjs
```

Optionele instellingen: `MURSAL_BASE_URL`, `PLAYWRIGHT_MODULE`, `BROWSER_CHANNEL`, `MURSAL_SCREENSHOTS`. Screenshots komen standaard in `test-results/`.

Gecontroleerd tijdens oplevering: alle twintig levels via zichtbare knoppen; boss-powers uitgeschakeld; 60 sterren en badge; fouten met Shield; bewaarde ronde na herladen; offline bordenboek en herladen; categorie-filter; tijd uitschakelen; 1440px desktop, 390px en 320px mobiel; 200% tekstvergroting. Tien tests controleren onder meer energieherstel, timeout, XP-herhaling, ontgrendeling en corrupte saves. Zie ook `TESTRESULTATEN.md`.

Dit is browsercontrole op een desktopmachine met mobiele schermmaten, geen fysieke iPhone-/Android-appstoretest.

## Vercel en Mursaltheorie

De productie-integratie is opgenomen in `integration/` en in de bestaande GitHub-repository `sanjarbaba/mursaltheorie` op Vercel. De ingang is `/game/spelen`. De bestaande website bevat Game-links op desktop en mobiel.

- `game/bootstrap.js` laadt de bestaande Clerk-login en vraagt `/api/v1/game` om toegang.
- `api/v1/game.js` verifieert het token, leest bestaande digitale toegang en retourneert pas daarna de inhoud. Antwoorden worden niet door de service worker gecachet.
- `api/v1/_game-access.js` controleert betaald digitaal product, startdatum, einddatum en intrekking. Beide bestaande digitale pakketten geven 30 dagen; een fysiek boek en een beta-vlag geven geen gameabonnement. Bestaande beheeraccounts behouden testtoegang.
- `api/v1/_game-data.js` bevat de inhoud en bronlaag. De publieke `game/data/worlds.js` bevat alleen de vraagopbouw en gebruikt de inhoud van de beschermde API.
- De bestaande betaal- en webhookcode blijft de bron voor aanschaf en looptijd. Er is geen extra factuur, abonnement of maandelijkse automatische incasso toegevoegd.
- Toegang wordt bij openen, terugkeren naar het tabblad en iedere 30 seconden gecontroleerd. De einddatum blokkeert de sessie. Internet is hiervoor nodig. De PWA bewaart het installatiescherm en afbeeldingen; voortgang blijft lokaal.

De integratie verwacht de bestaande `api/_lib.js`, Clerk-client, database en ingestelde Vercel-omgevingsvariabelen. Kopieer deze patches dus in de bestaande site, niet naar een leeg statisch project. Na wijzigingen: `node scripts/build-game-offline.mjs`. Tests: `node --test test/mursal-game.test.mjs test/comeback.test.mjs test/game-access.test.mjs`.

Een echte betaalde account is niet gebruikt voor een aankooptest. De abonnementslogica en de betaalde browserflow zijn met testgegevens gecontroleerd; de live anonieme toegang wordt apart gecontroleerd. Er zijn geen aankopen uitgevoerd.

## Uitbreiding: Wereld 2

Zie `WERELD-2.md` voor de inhoud, migratie, nieuwe bronnen en testresultaten. Beide werelden vallen onder de bestaande maandtoegang.
