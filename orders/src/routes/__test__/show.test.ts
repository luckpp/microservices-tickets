import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('can only be accessed with valid orderId', async () => {
  const orderId = 'wrong_mongo_id';
  await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Cookie', global.signin())
    .send()
    .expect(400);
});

it('fetches the order', async () => {
  const user = global.signin();

  // Create the ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({
      ticketId: ticket.id,
    })
    .expect(201);

  // Make a request to fetch the order
  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(200);

  expect(fetchedOrder.id).toEqual(order.id);
  expect(fetchedOrder.ticket.id).toEqual(ticket.id);
});

it('returns an error if one user tries to fetch another users error', async () => {
  // Create the ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  // Make a request to build an order with this ticket
  const userOne = global.signin();
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', userOne)
    .send({
      ticketId: ticket.id,
    })
    .expect(201);

  // Make a request to fetch the order
  const userTwo = global.signin();
  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', userTwo)
    .send()
    .expect(401);
});
