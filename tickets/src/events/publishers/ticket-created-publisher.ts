import { Publisher, Subjects, TicketCreatedEvent } from '@my-tickets/common';
import { Stan } from 'node-nats-streaming';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;

  constructor(client: Stan) {
    super(client);
  }
}