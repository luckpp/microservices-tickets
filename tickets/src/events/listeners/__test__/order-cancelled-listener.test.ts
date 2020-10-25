import { OrderCancelledEvent } from '@my-tickets/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../../models/ticket';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
    userId: mongoose.Types.ObjectId().toHexString(),
  });
  // Normally, when we create a ticket with Ticket.build(...) we don't assign it an order
  // and that is why we set the orderId afterwards
  ticket.set({ orderId });
  await ticket.save();

  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, orderId, data, msg };
};

it('updates the ticket, publishes an event, and acks the message', async () => {
  const { listener, ticket, orderId, data, msg } = await setup();
  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);
  expect(updatedTicket!.orderId).not.toBeDefined();

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const mockFunction = natsWrapper.client.publish as jest.Mock;
  const mockFunctionParameters = mockFunction.mock.calls[0];
  const dataJson = JSON.parse(mockFunctionParameters[1]);
  expect(dataJson.orderId).not.toBeDefined();

  expect(msg.ack).toHaveBeenCalled();
});
