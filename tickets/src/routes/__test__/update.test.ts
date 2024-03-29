import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { natsWrapper } from '../../nats-wrapper';
import { Ticket } from '../../models/ticket';

it('returns 404 if the provided id does not exist', async () => {
  const id = mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'Title',
      price: 10,
    })
    .expect(404);
});

it('returns 401 if the use is not authenticated', async () => {
  const id = mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'Title',
      price: 10,
    })
    .expect(401);
});

it('returns 401 if the use does not own the ticket', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'Title 1',
      price: 20,
    })
    .expect(201);
  const ticket = response.body;

  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'Title 2',
      price: 20,
    })
    .expect(401);
});

it('returns 401 if the use provides an invalid title or price', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'Title 1',
      price: 10,
    })
    .expect(201);

  const ticket = response.body;

  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: 20,
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'Title 2',
      price: -10,
    })
    .expect(400);
});

it('updated the ticket provided valid inputs', async () => {
  const cookie = global.signin();

  const responseCreate = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'Title 1',
      price: 10,
    })
    .expect(201);
  const ticketCreate = responseCreate.body;

  const title = 'New title';
  const price = 100;

  const responseUpdate = await request(app)
    .put(`/api/tickets/${ticketCreate.id}`)
    .set('Cookie', cookie)
    .send({
      title,
      price,
    })
    .expect(200);
  const ticketUpdate = responseUpdate.body;

  expect(ticketUpdate.title).toEqual(title);
  expect(ticketUpdate.price).toEqual(price);
});

it('publishes an event', async () => {
  const cookie = global.signin();

  const { body: createdTicket } = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'Title 1',
      price: 10,
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${createdTicket.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'New title',
      price: 100,
    })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(2);
});

it('rejects updates if the ticket is reserved', async () => {
  const cookie = global.signin();

  const { body: createdTicket } = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'concert',
      price: 10,
    })
    .expect(201);

  const ticket = await Ticket.findById(createdTicket.id);
  ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() });
  await ticket!.save();

  await request(app)
    .put(`/api/tickets/${createdTicket.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'new concert',
      price: 20,
    })
    .expect(400);
});
