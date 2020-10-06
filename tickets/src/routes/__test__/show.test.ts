import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('returns 404 if the ticket is not found', async () => {
  await request(app).get('/api/tickets/ticketId').send().expect(404);
});

it('returns the ticket if the ticket is found', async () => {
  const title = 'concert';
  const price = 20;

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price,
    })
    .expect(201);

  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send();

  //console.log(ticketResponse);

  const ticket = ticketResponse.body;

  expect(ticket.title).toEqual(title);
  expect(ticket.price).toEqual(price);
});
