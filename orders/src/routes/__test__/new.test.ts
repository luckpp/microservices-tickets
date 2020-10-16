import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';

it('returns an error if the ticked does not exist', async () => {
  const ticketId = mongoose.Types.ObjectId().toHexString();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId })
    .expect(404);
});

it('returns an error if the ticked is already reserved', async () => {
  const cookie = global.signin();

  const ticket = Ticket.build({
    title: 'concert',
    price: 100,
  });
  await ticket.save();

  const order = Order.build({
    ticket,
    userId: '1234',
    status: OrderStatus.Created, // we rely only on this status to tell if the order is expired
    expiresAt: new Date(),
  });
  await order.save();
  console.log('order', order);

  const response = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id })
    .expect(400);
});

it('reserves a ticket', async () => {});
