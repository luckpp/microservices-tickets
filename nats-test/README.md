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
