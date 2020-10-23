# Expiration Service

This project has similar structure to `tickets` project. For more references refer to `tickets` project README.md.

This is an worker services that listens for **order:created** events and after a given amount of time emits **order:expired** event for the order that expired.

## Expiration implementation

Expiration can be implemented in several ways:

### 1. setTimeout()

- set timeout when message is received
- downside: timer stored im memory but if device restarts, all timers are lost.

### 2. Rely on NATS

- when message is received verify the time; if everything is ok emit an event and ack the message, if not than do not ack the message
- downside: rely on NATS redelivery mechanism

### 3. Use a scheduled message (set delivery time on the message)

- when message is received verify the time; if everything is ok emit an event and ack the message, if not than emit the event and set on it the exact delivery time
- downside: it is not supported by NATS

### 4. Use Bull JS and Redis Server

- **Bull JS**
  - is a JS library that allows us to setup long lived timers or essentially give ourselves notifications
  - is a general purpose framework for allowing us to store some amount of data, do some processing on it and have some scheduled aspect to it as well
  - essentially we tell Bull JS to remind us to do some amount of work in the future
  - Bull JS is going to store te reminders inside of a Redis instance
- **Redis**:
  - is an in-memory database
  - is very commonly used for tasks similar with what has been described above
  - will store a list of jobs
  - after the time-out elapses it will notify Bull JS

## Bull JS

Explanation on how to use the Bull JS in a real world scenario:

- suppose that to a Web Server comes a request to convert an `mp4` file to an `MKV` file (this requires a lot of processing power)
- **Web Server** using Bull JS will schedule a **Job** on **Redis Server**
  - a Job is a plain Java Script object that describes some amount of processing that needs to be done
- **Redis Server** will store the **List of Jobs**
- one or more **Worker Services** will poll the Redis Server and wait for some Job to appear
  - as soon as a Job shows up a Worker Service will pull that Job, will do some processing on it, and send a message to Redis Server saying that the processing is complete

NOTE:

- Bull JS is used both on the Web Server and on the Worker Server
- Bull JS is designed for little jobs, and not intended to handle huge amount of messages

Terminology:

- when we start to make use of Bull, we are going to create a **Queue** (the main abstraction inside Bull JS)
- a **Queue** represents some series of messages that we want to queue up and eventually process over time
- we will use Bull JS to create a **Queue** and specify what we want to do with messages that are flowing through it

NOTE:

- in our **expiration service** we do not have a separate worker server, and everything is contained inside the **expiration service**
