# Payments Service

This project has similar structure to `tickets` project. For more references refer to `tickets` project README.md.

The main responsibility of this service is to handle payments for tickets.

We will use the **Stripe** payments platform in order to charge user's credit card.

## Payments with Stripe

Below is the description of the payment flow:

![Payments With Stripe API](./resources/images/payments_with_stripe_api.png)

### Steps for implementing payments with Stripe

#### 1. Install `Node Stripe SDK` npm module

- `npm i stripe`

#### 2. SignUp for a Stripe account and get an API Key

References: https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19826486

- go to https://stripe.com/
  - the look and feel of the page changes quite often
  - the API is famous for staying stable
- create a Stripe account
- once logged-in, from the landing page go to **API keys** section
  - the **Secret key** will allow us to reach to the Stripe API and charge a User's credit card
- the **Secret key** should be stored inside of our Kubernetes cluster as a secret
  - `kubectl create secret generic stripe-secret --from-literal STRIPE_KEY={stripe_secret_key}`
- reference the **STRIPE_KEY** from the `payments-depl.yaml`

#### 3. Initialize the Stripe SDK

- just create an instance of `Stripe` and make it available inside the project

```ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: '2020-08-27',
});
```

#### 4. Create a Stripe charge

Use the documentation available on: https://stripe.com/docs/api/charges/create?lang=node

```ts
import { stripe } from '../stripe';

//...
await stripe.charges.create({
  currency: 'ron',
  amount: order.price * 100, // we have to provide the smallest unit
  source: token,
  description: 'Payment for ticket', // this is optional
});
```

## Testing with Stripe

NOTE: **After signing-up to Stripe, the Stripe account will be operated in test mode. While the account is in test mode you do not work with real money, so no money is moved around. When we decide to go public with the application we will toggle of the `test mode`.**

**While the account is in test mode there is a very special `token` that we can provide, that will always succeed with the Stripe API.**

**The test Stripe token that will always succeed for Stripe accounts that are in test mode, is: `'tok_visa'`.**

In order to verify that we have successfully charged some amount of money we can go to the **Stripe Dashboard** and see if the charge is listed in the **Payments** section.

### Automate testing Stripe charges

There are two possible approaches to test if requests to create charges are handled correctly. You can use only one approach.

#### 1. Mock the Stripe API

Inside `src/__mocks__` folder add the mock implementation of the `Stripe API`:

```ts
export const stripe = {
  charges: {
    create: jest.fn().mockResolvedValue({}),
  },
};
```

Inside the test file make sure you import `stripe`, mock its content and use the mock to test:

```ts
import { stripe } from '../../stripe';

jest.mock('../../stripe');

it('returns a 201 with valid inputs', async () => {
  // ...

  const mockFunction = stripe.charges.create as jest.Mock;
  const chargeOptions = mockFunction.mock.calls[0][0];
  expect(chargeOptions.source).toEqual('tok_visa');
  expect(chargeOptions.amount).toEqual(order.price * 100);
  expect(chargeOptions.currency).toEqual('ron');
});
```

#### 2. Use directly the Stripe API

In this case you should remove all the mock implementations of `stripe` and make sure that the `src/test/setup.ts` defines on the top level the **_environment variable_** that holds the `Stripe API key`.

```ts
// make sure to change the name of the file src/__mocks__/stripe.ts to something else like for eg. src/__mocks__/stripe.ts.old
```

```ts
// inside src/test/setup.ts`
process.env.STRIPE_KEY = '... key from Stripe online dashboard ...';
```

```ts
// inside src/routes/new/__test__/new.test.ts`
// remove jest.mock('../../stripe');

// add the test below
it('returns a 201 with valid inputs - Real Stripe API', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 100000);

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 1,
    price: price,
    status: OrderStatus.Created,
    userId,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201);

  const charges = await stripe.charges.list({
    limit: 10,
  });

  const currentCharge = charges.data.find((c) => c.amount === price * 100);

  expect(currentCharge).toBeDefined();
  expect(currentCharge!.currency).toEqual('ron');
});
```
