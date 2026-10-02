# Apple-aankopen voor de iPhone-app

Deze branch is gebaseerd op de huidige `main` en voegt alleen de serverroute voor Apple-aankopen toe. De websitecheckout en de Stripe-webhook in `api/v1/access.js` blijven ongewijzigd. De iPhone-app betaalt met StoreKit via Apple; de server verifieert daarna de transactie en geeft het gekoppelde Clerk-account 30 dagen toegang via de bestaande `entitlements`-tabel. Build 1.0 (16) in TestFlight bevat de mobiele aankoop- en herstelinterface al.

## Veilige volgorde voor live activering

1. Controleer de diff tegen `main`, met extra aandacht voor Stripe. Rol de servercode uit terwijl `APPLE_IAP_ENABLED` ontbreekt of `false` is. De nieuwe route retourneert dan geen beschikbare producten en accepteert geen aankopen.
2. Pas `database/migrations/046_apple_in_app_purchases.sql` toe op de productiedatabase. Controleer dat versie 46 in `schema_migrations` staat en dat `apple_account_tokens`, `apple_iap_transactions` en `record_apple_iap_transaction` bestaan. Raak bestaande Stripe-bestellingen en rechten niet aan.
3. Maak met toestemming van de accounteigenaar een **In-App Purchase key** in App Store Connect → Users and Access → Integrations → In-App Purchase. De sleutel die Expo voor het uploaden van builds gebruikt, is een ander type sleutel. Zet de sleutel uitsluitend als geheime productievariabele in Vercel; bewaar of plaats de private sleutel nooit in Git of in chat.
4. Stel in Vercel-project `mursaltheorie1` de volgende productievariabelen in: `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY`, `APPLE_APP_ID` (App Store Connect app-ID `6817092966`), `APPLE_ACCOUNT_TOKEN_SECRET` (nieuwe willekeurige waarde van minstens 32 tekens), `APPLE_IAP_SANDBOX_TEST_USER_IDS` (alleen de bedoelde Clerk-testaccounts) en uiteindelijk `APPLE_IAP_ENABLED=true`. Gebruik voor de sleutel de rol en toegang die Apple voor de App Store Server API voorschrijft. Na een wijziging van Vercel-variabelen is een nieuwe deployment nodig om de waarden actief te maken.
5. Stel in App Store Connect de productie- en sandbox-URL voor **App Store Server Notifications V2** in op `https://www.mursaltheorie.nl/api/v1/apple-purchases?resource=notification`. Controleer met Apple's testmelding dat de server de ondertekende melding accepteert.
6. Test op een echte iPhone met TestFlight en een Apple Sandbox-account: prijzen en pakketten laden; elk van de drie producten kopen; correcte taaltoegang voor 30 dagen; Herstel aankopen met hetzelfde Clerk-account; geen toegang voor een ander Clerk-account; herhaalde melding/transactie zonder dubbele toegang; terugbetaling en verlopen toegang. Test ook dat Stripe-aankopen via de website nog normaal toegang geven. TestFlight-aankopen gebruiken Apple's sandbox en brengen geen echte kosten in rekening.
7. Maak schermafbeeldingen van het daadwerkelijke aankoopscherm voor de drie producten. Voeg die, de Apple-producten en build 1.0 (16) aan dezelfde App Review-inzending toe. Vul een afzonderlijk reviewaccount met actieve toegang en de contactgegevens in. Dien pas in na expliciete toestemming; de App Store-versie staat op handmatige vrijgave.

## Openstaande controles

- De live route gaf op 2 oktober 2026 HTTP 404. De Apple-servercode is nog niet live.
- In de zichtbare projectvariabelen van `mursaltheorie1` stonden geen `APPLE_IAP_*`-namen. Gedeelde variabelen zijn nog niet gecontroleerd.
- De databasemigratie is nog niet op productie geverifieerd; er is nog geen echte Sandbox-aankoop uitgevoerd.
- In App Store Connect ontbreken de notificatie-URL's, productscreenshots, reviewerlogin en contactgegevens. De contentrechtenverklaring stond bij controle ook nog leeg.

Apple-documentatie: [In-App Purchase key](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/generate-keys-for-in-app-purchases/), [servermeldingen](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/enter-server-urls-for-app-store-server-notifications), [testen met TestFlight](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox), [eerste aankoop indienen](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase).
