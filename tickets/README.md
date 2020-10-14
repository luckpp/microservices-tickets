# Tickets

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
