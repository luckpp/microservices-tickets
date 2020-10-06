import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';

it('returns 404 if the provided id does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
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
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'Title',
      price: 10,
    })
    .expect(401);
});

it('returns 401 if the use does not own the ticket', async () => {});

it('returns 401 if the use provides an invalid title or price', async () => {});

it('updated the ticket provided valid inputs', async () => {});
