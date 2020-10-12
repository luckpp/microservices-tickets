# NATS Streaming Server

- is used to share events across all the different services inside of our application
- information can be found on https://docs.nats.io/
  - make sure you look at the documentation for NATS Streaming
- notes: **NATS** and **NATS Streaming Server** are two different things, two separate programs, that behave differently:
  - NATS: a very simple and basic implementation of event sharing
  - NATS Streaming Server: is built on top of NATS, and it is more advanced and full-featured implementation
- we are going to run `nats-streaming` docker image in Kubernetes
  - have a look at the Commandline Options on Docker Hub

**_From now on I will refer to NATS Streaming Server simply as NATS._**

## Notes on NATS Streaming

- to communicate with NATS Streaming we will use a client library called `node-nats-streaming`

- NATS Streaming requires us to subscribe to **channels/topics** since events are emitted to specific channels

- NATS Streaming stores all events in memory (default), flat files or in a MySQL/PostgresDB

## NATS test project

- the current project will be used to test communication with NATS
- it will be written in TypeScript
- it will use `node-nats-streaming` library
- it has 2 **npm scripts**:
  - one to run code to **emit** events
  - one to run code to **listen** for events
- it will run outside of Kubernetes
  - still we will connect to the Node NATS Streaming Server running inside of the Kubernetes cluster

### Connect to NATS Streaming Server inside Kubernetes

#### Option #1:

- Publisher Program -> Ingress-Nginx -> Cluster IP Service -> NATS Pod
  - the Cluster IP Service governs access to NATS Pod
  - Ingress-Nginx contains some routes that is going to expose the Cluster IP Service
- this option is too have-weight for our test program

#### Option #2:

- Publisher Program -> NodePort Service -> NATS Pod
- this requires to write a config file, and it is still to much for a test program

#### Option #3:

- use **Port Forward**
- NOTE: **this should be strictly a development setting**
- we will run a command at our terminal that tells Kubernetes cluster to to port-forward a port of a veri specific Pod
- when we use port-forwarding causing Kubernetes to behave as though it had a NodePort Service running

Steps to define port-forwarding:

- `$ skaffold dev`
- `$ kubectl get pods` to copy the name of the pod for which to do port-forwarding
- `$ kubectl port-forward {name_of_the_pod} 4222:4222`
  - the first number 4222 is the port on the local machine to access in order to get at the pod
  - the second number 4222 is the port on the pod to access
- `$ npm run publish`
  - will be able to connect to NATS Streaming Server

**NOTE: this port-forwarding command is not related to NATS, we can use it for any pod that we want to connect directly to if it is a temporary connection.**

### Terminology around publishing events and listening for events

- subject: the name of the channel we want to publish information to
- channel: is something that we listen to
- subscription: is what actually is going to listen to the channel and receives data

NOTE: When using NATS, we can share only strings or raw data, so we can not share a plain JavaScript object.

## Scaling the application

At some point in time we might realize that our **listener** application is getting a load of traffic. We have to scale up the application and we have two options for scaling:

- **vertically**: we give more hardware resources
- **horizontally**: by creating more instances of the application

In the context of NATS, we have to keep in mind that whenever we connect to NATS Streaming Server, the server maintains a list of different clients it is connected to. So, if we want to start multiple instances of an application that connects to NATS SS, we have to use different id-s.

When scaling the application **horizontally** we have to make sure that an event is handled only by one instance. NATS Streaming Service makes this very simple by using **Queue Groups**.

### Queue Groups

- inside a `channel` we can create a `queue group`
- we can have multiple `queue groups` associated with a `channel`
- a `queue group` has a name

- when scaling horizontally we should make sure that when an instance of an application subscribes to a `channel` than it should also join a `queue group` inside that `channel`:
  - whenever an event comes to the channel, NATS Streaming is going to take a look at all the queue groups we have in that channel
  - than NATS Streaming is going to (more or less randomly) select one of the members out of the every one of the queue groups and and send the event to the selected member
  - **conclusion: only one member of the queue group receives the message**

**A `queue group` is created to make sure that multiple instances of the same service are not all going to receive the same event.**

```js
stan.on('connect', () => {
  console.log('Listener connected to NATS');

  const subscription = stan.subscribe(
    'ticket:created',
    'orders-service-queue-group'
  );

  subscription.on('message', (msg: Message) => {
    const data = msg.getData();

    if (typeof data === 'string') {
      console.log(`Received event #${msg.getSequence()}, with data: ${data}`);
    }
  });
});
```

### Acknowledge messages

- the default behavior of the `node-nats-streaming` library is to acknowledge the NATS Streaming Server that the message has been processed by the listener as soon as it is received by the listener
- we can change the behavior above by changing the default options and doing a manual acknowledge after the listener has received the message and has done some processing as result of that message
  - normally, if we do not acknowledge the incoming event, after a certain amount of time (30s) the NATS Streaming Server will attempt to send the same message to the next member of the `queue group` or even retry to send the message to the same listener if that is not part of a `queue group` that failed to acknowledge the message

```js
const options = stan.subscriptionOptions().setManualAckMode(true);
const subscription = stan.subscribe(
  'ticket:created',
  'orders-service-queue-group',
  options
);
subscription.on('message', (msg: Message) => {
  // processing
  // ...
  // acknowledge that the message has been processed
  msg.ack();
});
```

### Client health checks

With NATS Streaming we can see the following problem: sometimes when the client restarts there might be a delay for that client to start process messages.

Steps to reproduce the issue:

- start 1 publisher and 2 listeners:
  - `$ npm run publish`
  - `$ npm run listen`
- restart very fast the listeners:
  - write `rs` in the terminal where each of the listeners started
- restart very fast the publisher:
  - write `rs` in the terminal where the publisher started
- the publisher will send a message that will be processed with delay by one of the listeners

The full explanation is available on: https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19124552#notes.

In order to investigate the problem we can use NATS Streaming monitoring endpoint exposed at port 8222 (see the `nats-depl.yaml`):

- `$ kubectl port-forward {name_of_nats_pod} 8222:8222`
- using the browser navigate to the monitoring service:
  - http://localhost:8222/
- to see information related to clients and channels access:
  - http://localhost:8222/streaming
- to see detailed information related to channels access:
  - http://localhost:8222/streaming/channelsz?subs=1

Notes:

- whenever we restart a listener NATS Streaming will not immediately remove the subscription since it might think that is momentary interruption in connection (check the endpoint http://localhost:8222/streaming/channelsz?subs=1)
- also when the listener goes offline it is still not removed immediately from the subscriptions

#### How to help NATS streaming that when a listener goes offline it will not get back:

##### 1. Use the configuration parameters

We have done this configuration in the `nats-depl.yaml` using the following arguments:

```json
["-hbi", "5s", "-hbt", "5s", "-hbf", "2"]
```

Explanation for the config arguments above:

- all of the arguments are referring to heat-beat:
  - a small request sent by NATS Streaming to the connected clients on interval basis to make sure that each client is still up and running
- `-hbi`: how often NATS Streaming Server is going to make a heart-beat request to each of its clients
- `-hbt`: how log a client has to respond
- `-hbf`: the number of times that each client can fail before NATS Streaming Server is going to assume that the connection is gone

NOTE: **We can implement tighter heart-beat checks to fix the issues with the listener going offline.**

##### 2. Graceful client shutdown

This is a solution to tell NATS Streaming Server that the client disconnected and it will not go back, so NATS Streaming Server can remove it from the channel.

```js
stan.on('connect', () => {
  stan.on('close', () => {
    console.log('NATS connection closed!');
    // after the client closes down we will exit the process
    process.exit();
  });
  // ...
});

// listen for signals that are sent to this process any time the program is restarted or when you hit Ctrl+C
// as a result stan.close() will reach to NATS Streaming Server and cause the client to successfully close down
// it is not always guaranteed that those interrupt signals for the process will be received, so in those cases we have to relay
// on the heart-beat mechanism
process.on('SIGINT', () => stan.close());
process.on('SIGTERM', () => stan.close());
```

# Async communication between microservices

The async communication between microservices and microservices in general is really hard to manage on the data side.

**VERY IMPORTANT VIDEO FOR REFERENCE: https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19124562**

While communicating between microservices there are several ways in which things can go wrong:

- listeners can fail to process the event
- one listener might run more quickly than another
- NATS might think a client is still alive when it is not
- we might receive the same event twice (when the listeners fails to send ACK in the allocated time for event processing)

NOTE:

- the issues above are typical to all event bus implementations
- the issues above can happen in monolith architectures and also with microservices using sync style communication:
  - still the issues become more visible/prominent in with async communication when an additional layer of latency is added (the event bus)

## Possible (wrong) ways to solve the issues

References:

- https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19124570
- https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19124576

Possible (wrong) solutions:

- have only one instance of the service that is doing the processing
  - this is not feasible since we will have a bottleneck and we will be able to scale only vertically (not horizontally)
- handle all possible errors that can occur
  - this is very expensive \$\$\$ and most of the errors are very unlikely to appear
- share state between services of last event processed
  - this requires to process all the events in a sequential fashion which has a really big performance penalty
  - also this means we can do only one update at a time
- last event processed tracked by resource ID (this has elements from previous solution)
  - we will put all the events related to a resource in its own sequence pool
  - this is a great solution but there is an issue with the actual implementation in the context of NATS
    - in order to have the correct resource IDs sequence we have to create separate channels for each resource; still with NATS Streaming Server allows you to have max 1000 channels by default (and also the solution is not applicable with other event bus implementations)
- this solution is similar to the previous one but with an work-around generating sequence numbers for each resource
  - the publisher will have to keep track of the previous event ID for each event; so it will have to have its own DB and it will have to get information related to IDs associated to an event from the NATS Streaming Server; so the publisher will know exactly the IDs sequence that applies to each resource
  - the difficulty is to get ID information associated to an event from NATS Streaming Server

## Correct solution to solve the communication issues

Reference:

- https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19124578

Claims:

- most of the concurrency issues arise due to the fact that we are working with a poorly designed system and relying on NATS to somehow save us
- we need do properly design the microservices
- if we properly design our system, a better solution to the concurrency issues will present itself without worrying about any internal features of NATS

Solution:

- the idea is to have the publisher service compute a custom event id without relying on the NATS Streaming Service
- the custom event id will than be taken into account by the listener service that is responsible to proceed with event processing only if the event is in the right order (the order is established by the custom event id that could actually be a number that is incremented)

Solution details:

- https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19124586
- **for each resource from our application (eg. an entry into a DB) we will add a `version` flag, and we will add this flag to the service that is the canonical service that manages the given resource**:
  - example: the Tickets Service will manage the version flag for all the Tickets; the Tickets Service will be the only location where the version flag for a Ticket is ever to be directly updated
  - all other services that depend on Tickets Service will not have a higher version of Ticket and they will not update the version

## Durable Subscriptions

Reference: https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/1912459

During async communications we have to make sure that all events are delivered correctly and are not lost. There might be cases when the listener services go offline for a period of time or even start te activity long after the emitter services.

In order to solve the issue above we have to properly set up the options for the NATS subscription on the listener side:

### Deliver all available

- make sure that all events that are available and unprocessed are sent to the listener services when those services come online
  - this will make sure that all events emitted and unprocessed previous to the creation of a `durable subscription` will be delivered to the listener services that subscribed for the first time
  - this option will only be used for the very first time we bring the `durable subscription` online

```js
const options = stan
  .subscriptionOptions()
  .setManualAckMode(true)
  .setDeliverAllAvailable(); // <---
```

### Set the durable subscription

- set-up a `durable subscription` that is going to be created when we give an identifier to the subscription:
  - when we do that NATS Streaming Server, inside the channel that we are subscribing to, is going to create a record with all the durable subscriptions
  - whenever we emit an even, NATS Streaming Server is going to record if the subscription has received and processed the event

```js
const options = stan
  .subscriptionOptions()
  .setManualAckMode(true)
  .setDeliverAllAvailable()
  .setDurableName('listener-service'); // <---
```

### Create a queue group

- make sure to introduce the `queue group`
  - without the `queue group` when the listener service restarts or goes offline, NATS Streaming Service will say that the client disconnected and it will never come back and it will wipe the history of the durable name
  - if the `queue group` is available than the `durable name` will never be dumped since NATS Streaming Server will always persist it

```js
const subscription = stan.subscribe(
  'ticket:created',
  'listener-service-queue-group', // <---
  options
);
```

So `setDeliverAllAvailable()`, `setDurableName(...)` and the `queue group name` work together extremely well and gives us the behavior we want: do not lose events and deliver event to exactly one instance of the listener service:

- `setDeliverAllAvailable()`: give all the event emitted in the past
- `setDurableName(...)`: keeps track of the events that have gone to the `queue group name`
- `queue group name`: makes sure we are not dumping the durable name when the listener service restarts or goes offline for a brief period of time, and also will make sure that all the emitted events will go exactly to one instance of the listener service even if we run multiple instances

## Complete listener implementation

```js
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

  const options = stan
    .subscriptionOptions()
    .setManualAckMode(true)
    .setDeliverAllAvailable()
    .setDurableName('listener-service');

  const subscription = stan.subscribe(
    'ticket:created',
    'listener-service-queue-group',
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
```
