# Mursal Theorie mobiel

Expo SDK 57-basis voor iOS en Android. De app gebruikt dezelfde Clerk-gebruiker,
Neon-data en `/api/v1`-routes als de website.

## iOS testversie

De eerste iOS-testversie gebruikt:

- bundle ID: `nl.mursaltheorie.app`
- productie-API: `https://www.mursaltheorie.nl`
- dezelfde Clerk publishable key als de live website
- lokale caching van lessen (24 uur)
- offline fallback voor eerder geladen lessen
- lokale wachtrij voor voortgangssynchronisatie
- Nederlands, Dari/Farsi en Pashto

## Lokaal starten

1. Kopieer `.env.example` naar `.env`.
2. Voer `pnpm install` uit.
3. Voer `pnpm start` uit.

Zet nooit een Clerk secret key of andere server-secret in de mobiele app.

## iOS build

Voor een interne iPhone-build:

```
npx eas-cli build --platform ios --profile preview
```

Voor de TestFlight/App Store-build:

```
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

De eerste interne iPhone-builds en apparaatcontrole zijn uitgevoerd. Voor de resterende
App Store-stappen en de huidige blokkades: zie [APP_STORE_READINESS.md](./APP_STORE_READINESS.md).

De live website wordt door deze mobiele branch niet gewijzigd.
