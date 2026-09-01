# Mursaltheorie mobile roadmap

## Doelarchitectuur

De website en toekomstige Expo-apps voor iOS en Android gebruiken dezelfde
versieerbare Vercel API, Clerk-identiteit en Neon-database. UI-code wordt niet
gedeeld; API-contracten, gegevenstypen en content wel.

## Fase 1 — API-fundering

- [x] Voeg `/api/v1` toe zonder bestaande `/api/*` routes te breken.
- [x] Gebruik vaste responsevormen en machineleesbare foutcodes.
- [x] Maak Clerk authorized parties configureerbaar via een servervariabele.
- [x] Voeg contracttests toe.
- [ ] Implementeer v1 examenpogingen met server-side antwoordcontrole.
- [ ] Voeg schema-validatie en idempotency voor schrijfrequests toe.

## Fase 2 — Datamodel en migraties

- [x] Introduceer genummerde, herhaalbaar uitvoerbare SQL-migraties.
- [x] Modelleer lessen als versieerbare contentblokken.
- [x] Modelleer examens, vragen, antwoorden en uitleg afzonderlijk.
- [x] Voeg entitlements en onveranderlijke purchase events toe.
- [x] Voeg sync metadata toe aan voortgang.
- [x] Voer migratie 001 uit op Neon previewbranch `preview/codex/mobile-api-v1-foundation` en verifieer de tabellen.
- [ ] Migreer de bestaande beta-toegang naar entitlements.

## Fase 3 — Contentmigratie

- [ ] Extraheer lessen en vragen uit `learn5.html`.
- [ ] Vul ontbrekende unieke lesinhoud aan.
- [ ] Verwijder juiste antwoorden uit publieke payloads.
- [ ] Laat de website uitsluitend de v1-content API gebruiken.

## Fase 4 — Expo-app

- [ ] Maak een TypeScript Expo-project met Expo Router.
- [ ] Configureer Clerk Native API, iOS bundle ID en Android package name.
- [ ] Implementeer veilige tokenopslag, lokale contentcache en sync queue.
- [ ] Bouw lessen, examens, resultaten en accountbeheer native.

## Fase 5 — Betalingen en publicatie

- [ ] Koppel web-, Apple- en Google-aankopen aan centrale entitlements.
- [ ] Verifieer aankopen en webhooks server-side en idempotent.
- [ ] Voeg aankoopherstel, accountverwijdering en privacyflows toe.
- [ ] Test via TestFlight en Google Play internal testing.
