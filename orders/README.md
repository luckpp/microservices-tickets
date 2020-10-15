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
