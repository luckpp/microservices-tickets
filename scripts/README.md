# Scripts

The current project contains script files that will be used to test or interact with the current microservices app.

# Script src/tickets-stress-test

This script is a stress test to create 200 tickets and update each ticket 2 times. The **tickets service** API will be invoked and as a consequence of creating/updating tickets, corresponding NATS events will be generated.

The **orders service** will react to the published events and should replicate the tickets in its own DB.

At the end the **tickets service** and the **orders service** should contain the same tickets (with same `id`, `title` and `price`). You should check the differences by connecting to the corresponding DB pod for each service.

I also took care to start 4 replicas of each service.

To execute run:

- `npm run tickets-stress-test`
