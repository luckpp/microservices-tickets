import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';

it('returns an error if the ticked does not exist', async () => {
  const ticketId = mongoose.Types.ObjectId().toHexString();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId })
    .expect(404);
});

it('returns an error if the ticked is already reserved', async () => {});

it('reserves a ticket', async () => {});
