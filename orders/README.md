# Orders Service

This project has similar structure to `tickets` project. For more references refer to `tickets` project README.md.

The purpose of this service is to handle orders for tickets, so the data handled by this service is:

- **orders**
- **tickets** that are being ordered

## Associating orders and tickets

When associating records together with Mongo DB there are two strategies that could be used:

### Embedding

- an order document will embed all the information about a ticket
- this will make really easy to figure it out what orders are concerned with what tickets
- this option is not suited for our application

### Mongoose Ref/Population Feature

- we will have 2 separate collections of documents:
  - `orders` collection
  - `tickets` collection
- inside every order we optionally can have a reference to a ticket
- in this case tickets can be queried very quickly

The code below describes how can we use `mongoose` to interact with orders and tickets:

```js
// Associate an existing Order and Ticket
const ticket = await Ticket.findOne({});
const order = await Order.findOne({});
order.ticket = ticket;
await order.save();
```

```js
// Associate an existing Ticket with a *new* Order
const ticket = await Ticket.findOne({});
const order = Order.build({
  ticket: ticket,
  userId: '...',
  status: OrderStatus.Created,
  expiresAt: tomorrow,
});
await order.save();
```

```js
// Fetch an existing Order from DB with its associated Ticket
const order = await Order.findById('...').populate('ticket');
console.log(order.ticket.price);
```

Have a look in the current project at the following models in order to understand the relation between `Order` and `Ticket` model:

- `src/models/order.ts`
- `src/models/ticket.ts`

NOTE: **The models should be local to the service and should not be defined in the `common` library. The main reason is that in each service the model, even if it is replicated across services, might have different implementations.**
