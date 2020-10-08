import nats from 'node-nats-streaming';

// NOTE to restart the program while running just type 'rs' in the terminal

console.clear();

const stan = nats.connect('ticketing', '123', {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Listener connected to NATS');

  const subscription = stan.subscribe('ticket:created');

  subscription.on('message', (msg) => {
    console.log('Message received');
  });
});
