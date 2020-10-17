import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';

it('validates the orderId', async () => {
  const wrongOrderId = 'wrong_order_id';

  await request(app)
    .delete(`/api/orders/${wrongOrderId}`)
    .set('Cookie', global.signin())
    .send()
    .expect(400);
});

it('marks an order as cancelled', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
  });
  await ticket.save();

  const user = global.signin();

  // Make a request to create an order
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // Make a request to cancel an order
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(204);

  // Expectation to make sure the order is cancelled
  const cancelledOrder = await Order.findById(order.id);
  expect(cancelledOrder).toBeDefined();
  expect(cancelledOrder!.id).toEqual(order.id);
  expect(cancelledOrder!.status).toEqual(OrderStatus.Cancelled);
});

it.todo('emits an order cancelled event');
