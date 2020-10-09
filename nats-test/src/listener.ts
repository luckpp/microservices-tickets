import nats, { Message } from 'node-nats-streaming';
import { randomBytes } from 'crypto';

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

  const options = stan.subscriptionOptions().setManualAckMode(true);
  const subscription = stan.subscribe(
    'ticket:created',
    'orders-service-queue-group',
    options
  );

  subscription.on('message', (msg: Message) => {
    const data = msg.getData();

    if (typeof data === 'string') {
      console.log(`Received event #${msg.getSequence()}, with data: ${data}`);
    }

    // acknowledge that the message has been processed
    msg.ack();
  });
});

// listen for signals that are sent to this process any time the program is restarted or when you hit Ctrl+C
// as a result stan.close() will reach to NATS Streaming Server and cause the client to successfully close down
// it is not always guaranteed that those interrupt signals for the process will be received, so in those cases we have to relay 
// on the heart-beat mechanism
process.on('SIGINT', () => stan.close());
process.on('SIGTERM', () => stan.close());
