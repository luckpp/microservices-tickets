import Stripe from 'stripe';

// The responsibility of this file is to import Stripe, make an instance out of it and
// make it available to the rest of our project

export const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: '2020-08-27',
});
