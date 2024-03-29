import {
  ExpirationCompleteEvent,
  Publisher,
  Subjects,
} from '@my-tickets/common';

export class ExpirationCompletePublisher extends Publisher<
  ExpirationCompleteEvent
> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
