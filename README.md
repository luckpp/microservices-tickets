# microservices-tickets

This application is implemented using microservices architecture and exposes similar features with the ones available on https://www.stubhub.com/. Users can sell and buy tickets to a series of events.


# Development process for the right way of building microservices

**NOTE**: The big focus in microservices is to handle data!

## 1. Build a central library as NPM module

- this library will be used to share code between our different projects
- the downside is that we have to work on this library from the start of the project
	- you might have to think in advance of some middleware that might be required
	
## 2. Define all of our events in the shared library

- we will have a precise definition of what all those events are
- all the event properties are clear

## 3. Write everything in Typescript

- Typescript will help catching some of the errors at design-time

## 4. Write tests for as much as possible/reasonable

- some of the testing flows involve opening the browser and performing a precise series of events 
- we will write tests around data and some of the `express` things

## 5. Run Kubernetes (k8s) cluster in the cloud

- this will help avoiding pressure on the local dev machine
- allows one to develop almost as quickly as local
- it is a dev style cluster not a production cluster:
	- allows setting up a Skaffold workflow

## 6. Introduce a lot of code to handle concurrency issues

- this is an important item that will allow us to have data consistency.

