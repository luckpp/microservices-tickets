# NATS Streaming Server

- is used to share events across all the different services inside of our application
- information can be found on https://docs.nats.io/
  - make sure you look at the documentation for NATS Streaming
- notes: **NATS** and **NATS Streaming Server** are two different things, two separate programs, that behave differently:
  - NATS: a very simple and basic implementation of event sharing
  - NATS Streaming Server: is built on top of NATS, and it is more advanced and full-featured implementation
- we are going to run `nats-streaming` docker image in Kubernetes
  - have a look at the Commandline Options on Docker Hub

**_From now on I will refere to NATS Streaming Server simply as NATS._**

## Notes on NATS Streaming

- to communicate with NATS Streaming we will use a client library called `node-nats-streaming`

- NATS Streaming requires us to subscribe to **channels/topics** since events are emitted to specific channels

- NATS Straming stores all events in memory (default), flat files or in a MySQL/PostgresDB

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
