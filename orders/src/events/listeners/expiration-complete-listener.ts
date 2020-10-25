import { Message } from 'node-nats-streaming';
import {
  ExpirationCompleteEvent,
  Listener,
  Subjects,
} from '@my-tickets/common';
import { queueGroupName } from './queue-group-name';
import { Order, OrderStatus } from '../../models/order';
import { OrderCancelledPublisher } from '../publishers/order-cancelled-publisher';

export class ExpirationCompleteListener extends Listener<
  ExpirationCompleteEvent
> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
    const order = await Order.findById(data.orderId).populate('ticket');

    // TODO: I do not think we should throw an exception since by throwing an exception
    //       we will not ack the message anymore and NATS will try to republish the message.
    //       Still an order should never disappear from the system and we should never end up
    //       in the situation in which we get an expiration:complete event for an order that
    //       does not exist.
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === OrderStatus.Complete) {
      return msg.ack();
    }

    // NOTE: it does not make sense to set the `ticket` of an order to null since in the future we will not
    //       know when the ticket has been reserved. Also we have code in ticket.ts that tells whether or
    //       not a ticket is reserved and this is done by looking at the orders collection.
    order.set({
      status: OrderStatus.Cancelled,
    });
    await order.save();
    await new OrderCancelledPublisher(this.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });

    msg.ack();
  }
}
