# Mursal Theorie mobiel

Expo SDK 57-basis voor iOS en Android. De app gebruikt dezelfde Clerk-gebruiker,
Neon-data en `/api/v1`-routes als de website.

## Lokaal starten

1. Kopieer `.env.example` naar `.env`.
2. Vul de Clerk publishable key in; zet nooit de secret key in de app.
3. Voer `pnpm install` en daarna `pnpm start` uit vanuit deze map.

De voorlopige iOS bundle ID en Android package name zijn beide
`nl.mursaltheorie.app`. Bevestig deze vóór registratie in App Store Connect,
Google Play Console en Clerk Native applications; na publicatie zijn identifiers
lastig te wijzigen.

De preview-API staat in `.env.example`. Gebruik voor een storebuild pas de
productie-URL nadat PR #1 is gecontroleerd en samengevoegd.

