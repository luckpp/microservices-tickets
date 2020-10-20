import { Subjects } from './subjects';
import { OrderStatus } from './types/order-status';

export interface OrderCreatedEvent {
  subject: Subjects.OrderCreated;
  data: {
    id: string;
    version: number;
    userId: string;
    status: OrderStatus;
    // inside the order we use Date type for expiresAt, but since we want to convert that Date to a JSON
    // or a string manually in order to control how the time-zone gets set so we will use a string
    expiresAt: string;
    ticket: {
      id: string;
      price: number;
    };
  };
}
