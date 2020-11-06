# microservices-tickets

This application is implemented using microservices architecture and exposes similar features with the ones available on https://www.stubhub.com/. Users can sell and buy tickets to a series of events.

## Development process for the right way of building microservices

**NOTE**: The big focus in microservices is to handle data!

### 1. Build a central library as NPM module

- this library will be used to share code between our different projects
- the downside is that we have to work on this library from the start of the project
  - you might have to think in advance of some middleware that might be required

### 2. Define all of our events in the shared library

- we will have a precise definition of what all those events are
- all the event properties are clear

### 3. Write everything in Typescript

- Typescript will help catching some of the errors at design-time

### 4. Write tests for as much as possible/reasonable

- some of the testing flows involve opening the browser and performing a precise series of events
- we will write tests around data and some of the `express` things

### 5. Run Kubernetes (k8s) cluster in the cloud

- this will help avoiding pressure on the local dev machine
- allows one to develop almost as quickly as local
- it is a dev style cluster not a production cluster:
  - allows setting up a Skaffold workflow

### 6. Introduce a lot of code to handle concurrency issues

- this is an important item that will allow us to have data consistency.

# Running the application

## Running on local machine

In order to properly run the application on local machine we will use the `skaffold` tool.

In order for `skaffold` to properly run make sure that the following lines of code are active:

### In client project

In `client/api/build-client.ts` make sure you have the `baseUrl` set as follows:

```ts
return axios.create({
  baseURL: 'http://ingress-nginx-controller.kube-system.svc.cluster.local',
  headers: req.headers,
});
```

Explanation:

- **Next JS** will be used for server-side rendering
- when rendering on server-side, the client code will need to fetch data (like the current user) from other services hosted on Kubernetes cluster
- in order to properly fetch data we will use **cross namespace service communication** (all explanation done in the following article: https://luckpp.wordpress.com/2020/10/06/kubernetes-cross-namespace-service-communication/)

### In auth|expiration|orders|payments|tickets projects

- inside the `auth|expiration|orders|payments|tickets /src/app.ts` make sure you have:

```ts
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  })
);
```

Explanation:

- we want to use cookies only if the user is visiting our application over HTTPS connection
- note that when running the services with `skaffold` on `minikube` a x509:certificate signed by unknown authority will be used for https communication

---

## Running in the cloud

In order to deploy the application in the cloud the following providers have been used:

- **Digital Ocean** (https://www.digitalocean.com/) in order to host a Kubernetes cluster in the cloud
- **namecheap** (https://www.namecheap.com/) in order to buy a domain name

NOTES:

- for **Digital Ocean** I used a coupon code for a machine with 3 nodes
- on **namecheap** I a domain name (http://www.luckpp-tickets.xyz) but the subscription does not include HTTPS

In order for to properly run the app in the cloud make sure that the following lines of code are active:

### In client project

In `client/api/build-client.ts` make sure you have the `baseUrl` set as follows:

```ts
return axios.create({
  baseURL: 'http://www.luckpp-tickets.xyz',
  headers: req.headers,
});
```

Explanation:

- **Next JS** will be used for server-side rendering
- when rendering on server-side, the client code will need to fetch data (like the current user) from other services hosted on Kubernetes cluster
- in order to properly fetch data we will use **cross namespace service communication**
- there is currently a bug with ingress-nginx on Digital Ocean. More about this bug here:
  - https://github.com/digitalocean/digitalocean-cloud-controller-manager/blob/master/docs/controllers/services/examples/README.md#accessing-pods-over-a-managed-load-balancer-from-inside-the-cluster
  - https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/20144736

### In auth|expiration|orders|payments|tickets projects

- inside the `auth|expiration|orders|payments|tickets /src/app.ts` make sure you have:

```ts
app.use(
  cookieSession({
    signed: false,
    secure: false,
  })
);
```

Explanation:

- we want to use cookies also if the user is visiting our application over HTTP connection (remember that my **namecheap** subscription for 'http://www.luckpp-tickets.xyz' does not include HTTPS)
