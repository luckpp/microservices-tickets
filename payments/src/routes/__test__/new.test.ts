import { currentUser, OrderStatus } from '@my-tickets/common';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { stripe } from '../../stripe';

// Uncomment the code below to run tests with Mock Stripe API, and comment the test with Real Stripe API
jest.mock('../../stripe');

it('returns a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: '12345',
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it("returns a 401 when purchasing an order that doesn't belong to the user", async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 10,
    status: OrderStatus.Created,
    userId: mongoose.Types.ObjectId().toHexString(),
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: '12345',
      orderId: order.id,
    })
    .expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 1,
    price: 10,
    status: OrderStatus.Cancelled,
    userId,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: '12345',
      orderId: order.id,
    })
    .expect(400);
});

// Uncomment the code below to run tests with Mock Stripe API, and comment the test with Real Stripe API
//
it('returns a 201 with valid inputs - Mock Stripe API', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 1,
    price: 10,
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

  const mockFunction = stripe.charges.create as jest.Mock;
  const chargeOptions = mockFunction.mock.calls[0][0];
  expect(chargeOptions.source).toEqual('tok_visa');
  expect(chargeOptions.amount).toEqual(order.price * 100);
  expect(chargeOptions.currency).toEqual('ron');
});

// Uncomment the code below to run tests with Real Stripe API, and comment the test with Mock Stripe API
//
// it('returns a 201 with valid inputs - Real Stripe API', async () => {
//   const userId = mongoose.Types.ObjectId().toHexString();
//   const price = Math.floor(Math.random() * 100000);

//   const order = Order.build({
//     id: mongoose.Types.ObjectId().toHexString(),
//     version: 1,
//     price: price,
//     status: OrderStatus.Created,
//     userId,
//   });
//   await order.save();

//   await request(app)
//     .post('/api/payments')
//     .set('Cookie', global.signin(userId))
//     .send({
//       token: 'tok_visa',
//       orderId: order.id,
//     })
//     .expect(201);

//   const charges = await stripe.charges.list({
//     limit: 10,
//   });

//   const currentCharge = charges.data.find((c) => c.amount === price * 100);

//   expect(currentCharge).toBeDefined();
//   expect(currentCharge!.currency).toEqual('ron');
// });
