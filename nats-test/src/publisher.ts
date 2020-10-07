import node from 'node-nats-streaming';

// `stan` is actually the client
const stan = node.connect('ticketing', 'abc', {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Publisher connected to NATS');
});
