import { Message } from 'node-nats-streaming';
import { Listener, OrderCreatedEvent, Subjects } from '@my-tickets/common';
import { queueGroupName } from './queue-group-name';
import { expirationQueue } from '../../queues/expiration-queue';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    const expirationTime = new Date(data.expiresAt).getTime();
    const currentTime = new Date().getTime();
    const delay = expirationTime - currentTime;

    console.log('Waiting this many milliseconds to process the job:', delay);

    await expirationQueue.add(
      {
        orderId: data.id,
      },
      {
        delay,
      }
    );
    msg.ack();
  }
}
