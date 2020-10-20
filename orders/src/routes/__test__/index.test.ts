import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

const buildTicket = async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  return ticket;
};

it('fetches orders for a particular user', async () => {
  // Create three tickets
  const ticketOne = await buildTicket();
  const ticketTwo = await buildTicket();
  const ticketThree = await buildTicket();

  const userOne = global.signin();
  const userTwo = global.signin();

  // Create one order as User #1
  await request(app)
    .post('/api/orders')
    .set('Cookie', userOne)
    .send({ ticketId: ticketOne.id })
    .expect(201);

  // Create one order as User #2
  const { body: orderTwo } = await request(app) // destructure and rename at the same time
    .post('/api/orders')
    .set('Cookie', userTwo)
    .send({ ticketId: ticketTwo.id })
    .expect(201);

  const { body: orderThree } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwo)
    .send({ ticketId: ticketThree.id })
    .expect(201);

  // Make request to get orders for User #2
  const { body: orders } = await request(app)
    .get('/api/orders')
    .set('Cookie', userTwo)
    .send()
    .expect(200);

  // Make sure we only got the orders for user #2
  expect(orders.length).toEqual(2);
  expect(orders[0].id).toEqual(orderTwo.id);
  expect(orders[1].id).toEqual(orderThree.id);
  expect(orders[0].ticket.id).toEqual(ticketTwo.id);
  expect(orders[1].ticket.id).toEqual(ticketThree.id);
});
