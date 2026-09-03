# Betalingen activeren

De betaalbackend gebruikt Stripe Checkout. Mursaltheorie ontvangt of bewaart geen kaartnummer, CVC of vervaldatum.

Benodigde Vercel-variabelen:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `APP_URL=https://www.mursaltheorie.nl`

Stel in Stripe de webhook-URL in op:

`https://www.mursaltheorie.nl/api/v1/access?resource=stripe-webhook`

Schakel minimaal het event `checkout.session.completed` in. De webhook controleert alle geldige Stripe `v1`-handtekeningen, slaat alleen minimale transactiegegevens op en activeert daarna `theory_b_access` voor het ingelogde account. Herhaalde events zijn idempotent.

De checkout wordt voor een ingelogde gebruiker gestart met een `POST` naar:

`/api/v1/access?resource=checkout`

De checkout gebruikt een korte idempotency-sleutel tegen dubbele sessies door herhaald klikken. Een account dat al actieve of bestaande toegang heeft, krijgt geen nieuwe checkout.

Zonder bovenstaande variabelen blijft betalen bewust uitgeschakeld met foutcode `PAYMENTS_NOT_CONFIGURED`.

