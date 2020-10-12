import nats from 'node-nats-streaming';
import { randomBytes } from 'crypto';
import { TicketCreatedListener } from './events/ticket-createde-listener';

// to restart the program while running just type 'rs' in the terminal
// which is a command for ts-node-dev tools

console.clear();

const stan = nats.connect('ticketing', randomBytes(4).toString('hex'), {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Listener connected to NATS');

  stan.on('close', () => {
    console.log('NATS connection closed!');
    // after the client closes down we will exit the process
    process.exit();
  });

  new TicketCreatedListener(stan).listen();
});

// listen for signals that are sent to this process any time the program is restarted or when you hit Ctrl+C
// as a result stan.close() will reach to NATS Streaming Server and cause the client to successfully close down
// it is not always guaranteed that those interrupt signals for the process will be received, so in those cases we have to relay 
// on the heart-beat mechanism
process.on('SIGINT', () => stan.close());
process.on('SIGTERM', () => stan.close());
