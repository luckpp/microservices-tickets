import node from 'node-nats-streaming';
import { TicketCreatedPublisher } from './events/ticket-created-publisher';

// to restart the program while running just type 'rs' in the terminal
// which is a command for ts-node-dev tools

console.clear();

// `stan` is actually the client
const stan = node.connect('ticketing', 'abc', {
  url: 'http://localhost:4222',
});

stan.on('connect', async () => {
  console.log('Publisher connected to NATS');

  const publisher = new TicketCreatedPublisher(stan);

  try {
    publisher.publish({
      id: '1234',
      title: 'concert',
      price: 10,
    });
  } catch (err) {
    console.error(err);
  }
});
