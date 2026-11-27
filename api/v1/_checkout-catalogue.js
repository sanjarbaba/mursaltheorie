import {catalogue,offerFor as publicOffer} from '../../storefront-config.js';
const links={
  "theory_b_nl_30d": {
    "sale": {
      "id": "plink_1UZeFyKBUCvMx3oMiDbpDge9",
      "url": "https://buy.stripe.com/bJe3cw1uL37Das14b0aVa09"
    },
    "regular": {
      "id": "plink_1UTNb0KBUCvMx3oMW7c491tF",
      "url": "https://buy.stripe.com/14A7sMehxfUpdEd5f4aVa04"
    }
  },
  "theory_b_nl_fa_30d": {
    "sale": {
      "id": "plink_1UZeG0KBUCvMx3oMpLw8jIX8",
      "url": "https://buy.stripe.com/dRm5kEflB0Zv2Zz36WaVa0a"
    },
    "regular": {
      "id": "plink_1UTNbGKBUCvMx3oMd0ZLAj4X",
      "url": "https://buy.stripe.com/dRm28s6P5cIdcA96j8aVa05"
    }
  },
  "theory_b_nl_ps_30d": {
    "sale": {
      "id": "plink_1UZeG2KBUCvMx3oMSw1vkLhz",
      "url": "https://buy.stripe.com/4gM6oIddt5fL0RrgXMaVa0b"
    },
    "regular": {
      "id": "plink_1UTNbKKBUCvMx3oMgJygTZSd",
      "url": "https://buy.stripe.com/5kQ5kEgpF5fL0Rr22SaVa06"
    }
  },
  "theory_b_book": {
    "regular": {
      "id": "plink_1UTOpPKBUCvMx3oMZdkQAVVy",
      "url": "https://buy.stripe.com/fZu7sM2yPgYt9nXcHwaVa07"
    }
  }
};
export function offerFor(key,now=Date.now()){const offer=publicOffer(key,now);if(!offer)return null;return {...offer,paymentLink:catalogue(now).campaign.active&&links[key].sale?links[key].sale:links[key].regular};}
