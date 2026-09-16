> **Integratie in deze repository:** de speelbestanden staan in `game/`; de ingang is `/game/spelen`. Na wijzigingen: `node scripts/build-game-offline.mjs`. Test: `node --test test/mursal-game.test.mjs`. De overige startinstructies hieronder beschrijven het zelfstandige opleverproject.

# Mursal Theory Hero – Complete Game v1

Een zelfstandige Nederlandstalige webgame/PWA. **Wereld 1: Verkeersborden is volledig speelbaar in 20 levels.** De zeven volgende werelden en de finale Theorie Examen zijn aangekondigde uitbreidingen, nog niet speelbaar.

## Direct starten

Vereist: Node.js 20 of hoger. Geen runtime-pakketten, accounts, databases of API-sleutels nodig.

```sh
node server.mjs
```

Open **http://localhost:4173**. Dezelfde opdracht werkt op Windows, macOS en Linux. Of gebruik `npm start`. Open niet rechtstreeks `index.html`: modules en PWA-opslag hebben een webserver nodig.

Voor een andere poort stel je `PORT` in. De testserver luistert op alle netwerkinterfaces; voor PWA-installatie gebruik je localhost of een HTTPS-site. Een gewoon HTTP-adres op je lokale netwerk ondersteunt niet alle PWA-functies op een telefoon.

## Wat je kunt spelen

- 20 oplopende levels, verdeeld over vier hoofdstukken; 27 officiële verkeersborden.
- Bord herkennen, het passende bord kiezen, borden sorteren, timed challenges, schematische verkeerssituaties en een geheugenronde.
- Mini-boss De Poortwachter op level 10; De Bordenbaas op level 20.
- XP, maximaal 60 sterren, levelontgrendeling, vijf energiepunten en de virtuele Bordenheld-badge.
- Verkeersvisie geeft kijktips. Focus Shield beschermt één energiepunt maar wist geen fout. Kennisboost verdubbelt XP voor drie goede antwoorden. Elke power eenmaal per ronde; geen powers bij bazen.
- Fouten en verlopen tijd krijgen uitleg en een bronlink. Meestal is 60% goed nodig, bij beide bazen 80%.
- Alles goed geeft drie sterren; minimaal 80% twee sterren; een overige geslaagde ronde één ster. Alleen verbetering van de beste XP-score van een level voegt XP toe. Herhaling verlaagt je beste sterren niet.
- Vrij oefenen kan altijd, ook zonder energie. Drie goede oefenantwoorden achter elkaar herstellen één energie. Automatisch herstel: één energie per tien minuten, maximaal vijf. Oefenen ontgrendelt geen levels en geeft geen XP.
- Klok uitschakelen via **Mijn held → Zonder tijdsdruk**. Een onderbroken ronde is te hervatten; bij verlaten van het tabblad pauzeert de klok.

## PWA en lokale voortgang

Open de game eenmaal online zodat alle bestanden worden opgeslagen. Gebruik daarna **Installeer de game** of de installatieoptie van Chrome/Edge. Op iPhone/iPad: Safari → Delen → Zet op beginscherm. Installatieknoppen verschillen per browser.

De service worker bewaart alle spelbestanden, borden en Mursal lokaal. Er zijn geen externe lettertypen of externe afbeeldingen nodig. De cache heeft een inhoudsafhankelijke versie. Na bronwijzigingen:

```sh
node scripts/build-offline.mjs
```

Voortgang gebruikt `localStorage`, sleutel `mursal-theory-hero.v1`. Gebruik dezelfde browser en hetzelfde webadres. Er is nog geen accountkoppeling of synchronisatie. Wissen van browsergegevens wist ook de voortgang. Als opslag niet beschikbaar is, verschijnt een duidelijke waarschuwing. **Mijn held → Voortgang opnieuw beginnen** vraagt bevestiging voordat het spel opnieuw begint.

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

Nieuwe inhoud wordt toegevoegd via `WORLDS`, `LEVELS`, `SIGNS` en scenario's, met een eigen `worldId` en bronverwijzingen. De vraagopbouw staat los van de score-engine. Wereld 1 heeft nu twintig opeenvolgende numerieke level-ID's. Bij een volgende wereld: maak de ontgrendeling en badgeberekening wereldspecifiek, vervang de huidige Wereld-1-tellers in de interface en voeg een migratie toe als de savevorm verandert. Bestaande level-ID's niet hernummeren.

## Broncontrole

Inhoudseditie: **16 september 2026**. Primaire bron: RVV 1990, geldend vanaf **1 juli 2026**.

- [RVV 1990 en Bijlage 1](https://wetten.overheid.nl/BWBR0004825/2026-07-01/#Bijlage1).
- [Rijksoverheid: welke verkeersborden en verkeersregels gelden?](https://www.rijksoverheid.nl/vraag-en-antwoord/verkeersveiligheid/welke-verkeersborden-en-verkeersregels-gelden-in-nederland).

Het officiële document is tijdens de bouw opgehaald en de 27 gebruikte borden zijn op code en omschrijving gecontroleerd. Situaties verwijzen waar nodig naar de artikelen 1, 54, 62, 63, 64, 67 en 79. In `SOURCES` staan versie, controledatum, uitgever en URL. Bij wijzigingen eerst de wettelijke bron vergelijken, dan uitleg/vragen bijwerken, tests uitvoeren en de offline build opnieuw maken. Er is geen automatische juridische actualisering.

Verkeersafbeeldingen komen uit de officiële RVV-bijlage. Mursal is een frame uit de door de eigenaar aangeleverde referentievideo. De game gebruikt geen CBR-branding en claimt geen officiële samenwerking. De badge is geen rijbewijs of examencertificaat.

## Testen

```sh
node --test tests/engine.test.mjs
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

Voor zelfstandige hosting staat `vercel.json` klaar: statische outputmap `dist`, geen installatie of frameworkbuild nodig. Voer na wijzigingen de offline build uit voordat je publiceert.

Voor integratie in Mursaltheorie worden uitsluitend de bestanden uit `dist/` onder `game/` geplaatst. De bestaande site krijgt een ingang **Game**. De speelpagina is `/game/spelen`; deze extra naam houdt relatieve bestands-URL's correct bij de bestaande Vercel-instelling `cleanUrls`. `/game` verwijst door naar `/game/spelen`. De geïntegreerde manifest start op `./spelen` en behoudt scope `./`; de service worker blijft binnen `/game/`.

De prototypevoortgang blijft lokaal en los van de bestaande les-/examenvoortgang. Een latere accountkoppeling kan dezelfde score-engine gebruiken met een andere opslagadapter.
