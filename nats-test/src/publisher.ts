import node from 'node-nats-streaming';

// to restart the program while running just type 'rs' in the terminal
// which is a command for ts-node-dev tools

console.clear();

// `stan` is actually the client
const stan = node.connect('ticketing', 'abc', {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Publisher connected to NATS');

  const data = JSON.stringify({
    id: '1234',
    title: 'concert',
    price: 10,
  });

  stan.publish('ticket:created', data, () => {
    // this callback is optional and is invoked after the data has been published
    console.log('Event published');
  });
});
