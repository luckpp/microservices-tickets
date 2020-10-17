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

## Mongoose add instance methods to the documents

There might be cases when we want to reuse some code related to a mongoose document. In those cases the best place to add that code is inside the document definition itself. We will use the Ticket model and we will follow the steps below

- extend the `interface TicketDoc`

```js
interface TicketDoc extends mongoose.Document {
  // ...
  isReserved(): Promise<boolean>;
}
```

- extend the `ticketSchema` and add a new 'instance' method:

```js
// It is critical to use `function` keyword instead of the arrow function
// since the `function` gets its own context through `this`.
// The `this` will point to the actual document we are operating on.
ticketSchema.methods.isReserved = async function () {
  // this === the ticket document that we just called 'isReserved(...)' on
  const existingOrder = await Order.findOne({
    ticket: this, // mongoose will make sure to pull out the ticketId and use it in the mongo query
    status: {
      $in: [
        OrderStatus.AwaitingPayment,
        OrderStatus.Created,
        OrderStatus.Complete,
      ],
    },
  });
  return !!existingOrder;
};
```

## Cool Info

### Testing

In order to mark tests that should be implemented we can have the following code inside the test file:

```js
it.todo('emits an order created event');
```

### Date objects

Inside our `Order` model we have defined the `expiresAt` property of type `Date`. Whenever an order gets saved to the DB, Mongo will take care to convert that date to a string.

There are cases when we have properties of type `Date` on an object that will be serialized to `string`. When that `Date` property will turn itself into string, the default behavior will be to turn itself into a string that will represent the current timezone.

NOTES:

- **Whenever we share timestamps across services, we want to communicate them in some kind of timezone-agnostic way. So ideally we will provide an UTC timestamp.**
- **UTC timestamp is going to work regardless of the timezone of the service that receives the timestamp.**

```js
// convert Date to UTC string
const expiresAt: string = order.expiresAt.toISOString(); // order.expiresAt is of type Date
```
