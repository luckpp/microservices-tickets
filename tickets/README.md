# Tickets Service

This project has similar structure to `auth` project. For more references refer to `auth` project README.md.

The files that are similar to those in `auth` project are:

- `.dockerignore`
- `Dockerfile`
- `package-lock.json`
- `tsconfig.json`
- `src/test/setup.ts`
- `src/app/ts`
- `src/index.ts`

## Publishing events

All events will be published to NATS Streaming Server. For more details see the project `nats-test` inside the current workspace.

NOTE: when publishing events we have to take into consideration that mongoose might implement pre/post save hooks and data sanitization, so in order to create the event we will have to use the results from a mongoose insert/update operation instead of using the data that we input into those operations.

### Publishing issues

When receiving data into a microservice via API, we save the data to DB if we are in the canonical service, but after save we might not have the chance to publish a subsequent event to the NATS Streaming Server. As a result we end up with data inconsistencies since other microservices might not have the chance to react and do the necessary updates.

Conclusion: **We can get into serious troubles if we save a record to DB but we fail to publish an event for that record!**

```js
await ticket.save();
// if the operation below fails we end in troubles
await new TicketCreatedPublisher(natsWrapper.client).publish({
  id: ticket.id,
  title: ticket.title,
  price: ticket.price,
  userId: ticket.userId,
});
res.status(201).send(ticket);
```

#### Solving the issue

##### References:

- https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19485346
- https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19485352

##### Solution:

- whenever we save a record into the DB we will save the associated event (that is going to be published) into the same DB in an **events collection**
- we will have an watcher process that will dispatch all events from the **events collection** to the NATS Streaming Server
- now the issue we have to solve is making sure that the record saving and event saving is atomic and si done inside of a **database transaction**
- all notes from above are referring to **Transactional outbox** pattern (https://microservices.io/patterns/data/transactional-outbox.html)

##### Solution steps from Udemy Q&A section:

1. We no longer publish events directly, instead we perform an atomic multi-document write to MongoDB for writing to the events collection and whatever other DB operations.

2. The events will have a property of "isLocked" which defaults to true and a array of failures which by default is empty.

3. We use a Change Stream (https://docs.mongodb.com/manual/changeStreams/) subscribed for changes on the events collection.

4. When a new event is written, the stream handler attempts to publish it and if it is successful it deletes the event document, if it fails, it sets isLocked to false for that event document and adds an entry to its failures array with some metadata about the failure.

5. All along we had a cron job running (there are many very good packages for this like: agenda, bull and bee) and lets call it "RetryPublishingNATSEvents".

6. RetryPublishingNATSEvents will read all docs from the events collection that are not locked and retry them, for successful publications it deletes the respective event, for failures it adds a new entry to the event's failures array (eventually we might want to write to some persistent logs when the failures array reaches a certain length and even trigger a notification to let a human in the team know about it).

We end up with an oscillating collection of events, that dynamically grows and shrinks (remember that we delete events on successful publication) so no need to worry about an infinitely growing collection of events.

Regarding the proxy between writing to the events collection and actually publishing it to NATS we are using an efficient low level artifact native to the DB we are using (I am referring to MongoDB Change Streams), so I am not worried about the extra latency we are adding to the system because:

1. It is relatively low (Change Steams are very efficient)

2. It pays off in data integrity gains 💪

# Environment variables for NATS connection

We should define in the k8s `ticket-depl.yaml` config file the following environment variables:

- `NATS_URL`
  - can be hard-coded
- `NATS_CLUSTER_ID`
  - can be hard-coded
- `NATS_CLIENT_ID`
  - this can not be hard-coded since it needs to be unique for every client that we connect to NATS Streaming Server
  - we can not hard-code it if we are running multiple copies of our service
  - we could use the name of the Kubernetes pod that is unique since we do not have two pods that are running the tickets service with identical names

```yaml
env:
  - name: NATS_URL
    value: 'http://nats-srv:4222'
  - name: NATS_CLUSTER_ID
    value: ticketing
  - name: NATS_CLIENT_ID
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
```

# Concurrent updates

## Records update with Optimistic Concurrency Control (OCC)

More info on OCC on https://en.wikipedia.org/wiki/Optimistic_concurrency_control

We want to make sure that we always update the correct version of a record in DB and we keep track of the record version. We will implement the OCC.

In order to correctly handle concurrent updates this is the flow that has to be followed:

- fetch the record from DB
- update the document
- save the document
- mongoose will update the version of the document automatically
- mongoose will send the update request off to mongoDB
- mongoDB will update the document with the indicated ID and Version

To handle the versioning part we will use an npm module called `mongoose-update-if-current`.
In order to implement the OCC using the module above and `mongoose` do the following inside the model file:

```ts
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
// ...
// after ticketSchema definition

// Tell mongoose that we want to track the version of the documents using the field 'version' instead of the default '__v'.
// So to rename the '__v' write the line below.
// It is important to have the line below right above the line where we wire the 'updateIfCurrentPlugin' plugin.
ticketSchema.set('versionKey', 'version');
ticketSchema.plugin(updateIfCurrentPlugin);
```

## Versioning

When using record versioning, the following question might arises: **When should we increment the `version` number of a record with an event?**

Answer: **Increment the `version` number whenever the `primary/canonical service responsible for a record` emits an event to describe a `create/update/destroy` to a record.**

Whenever a listener gets an event telling that the primary/canonical service has update a record, than the listener service should search in its replicated collection the record that has the correct `id` and the `version` that is previous to the `version` inside the event:

```js
async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
  const ticket = await Ticket.findOne({
    _id: data.id,
    version: data.version - 1,
  });
  // if the ticket is not null than the current msg/event is the one that should be processed in the correct order
}
```

### Alternative to `mongoose-update-if-current` module

This chapter should be part of the **orders service** but has been added here in order to keep all information related to versioning in one place.

We know that the **tickets service** is the canonical service that manages tickets and issues events whenever a ticket is created/updated. The **orders service** reacts to those events and replicates the tickets in its own DB.
Furthermore the **orders service** uses the `mongoose-update-if-current` module in order to manage the version of the tickets that get replicated.

Using `mongoose-update-if-current` inside of the **orders service** (which is a listener) is kind of cheating since we make assumptions related to how the **tickets service** (which is a publisher) handles the versioning of records. Moreover, the versioning can be done using timestamps or can be done with numbers that get incremented lets say with 100 for each successive version, etc.

This chapter contains an example of how the **orders service** should manage versioning of tickets without relying on the `mongoose-update-if-current` module.

Reference: https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19565160

First we should understand what `mongoose-update-if-current` module does. Below ar the two steps:

1. updates the version number on records before they are saved
2. customizes the find-and-update operation (save) to look for the correct version

In order to manually replace **step #1** do the following:

```js
// inside of orders/src/events/listeners/ticket-updated-listener.ts

// extract the received version and set it to the  ticket that will be saved
const { title, price, version } = data;
ticket.set({
  title,
  price,
  version,
});
await ticket.save();
```

In order to manually replace **step #2** do the following:

```js
// inside orders/src/models/ticket.ts

// ...
ticketSchema.set('versionKey', 'version');

// This is a middleware that will run before saving a record.
// The `function` keyword has to be used in order to access te document that is saved through the `this` keyword.
// If and arrow function would have been used the `this` keyword would have been overridden.
ticketSchema.pre('save', function (done) {
  // What we try to do here is to Extend the $where operation in order to take the version into account
  // @ts-ignore (we added this since TS does not understand what $where is
  this.$where = {
    version: this.get('version') - 1,
  };
  // We tell mongoose that we are done with this operation
  done();
});
// ...
```

Conclusion: the replacements above for steps #1 and #2 are everything that is required in order to be independent from the usage of `mongoose-update-if-current` module.

## Locking a ticket

There might be cases when we want to **lock** a ticket in order to prevent it from being edited.
The situation in which we would like to **lock** a ticket is for example when we have just created an order for that ticket in the **orders service** and form that point on we want to prevent somebody to change the ticket price or description.

### Obvious solution (that is not enough)

Just have a `boolean` flag on the ticket record.

In this case when somebody wants to edit the ticket the following steps occur:

- client asks: is somebody buying the ticket
- ticket service responds: yes, but I don't know who or what the status of the order is

### Next solution

On the ticket itself we will record the `orderId`.

In this case getting information about the status of the ticket will be straightforward.

Conclusion:

- we will use the presence of an `orderId` to decide whether or not a ticket is reserved and to know if we should prevent edits to it.
- technically is not necessary to have the `orderId` stored on the ticket in order to get exact information related to an order; we could also expose an endpoint on the **orders service** that gets the order status based on the `ticketId`
