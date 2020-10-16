import request from 'supertest';
import { app } from '../../app';

it('can only be accessed with valid orderId', async () => {
  const orderId = 'wrong_mongo_id';
  await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Cookie', global.signin())
    .send()
    .expect(400);
});
