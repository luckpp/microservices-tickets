import { Message } from 'node-nats-streaming';
import {
  Listener,
  OrderStatus,
  PaymentCreatedEvent,
  Subjects,
} from '@my-tickets/common';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    const order = await Order.findById(data.orderId);

    // NOTE: by throwing an error the message is not acknowledge and NATS will try to resend it
    if (!order) {
      throw new Error('Order not found');
    }

    order.set({
      status: OrderStatus.Complete,
    });
    await order.save();

    // TODO:
    // - We are updating an order so the order version is incremented
    // - Technically we should publish an event for eg. order:updated
    // - In this app we do not expect to have further updates on Complete orders so we will not emit an event
    // - It would be nice though to emit an order:updated event to stay consistent

    msg.ack();
  }
}
