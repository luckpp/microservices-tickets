# Init

After installing `typescript` package we should create a **.tsconfig**:
`$ tsc --init`

# Notes

## Server restarts and files watchers

If all Kubernetes and Skaffold config files have been properly defined you should start `skaffold dev`.

If you did not see your server restart after changing the index.ts file, do the following:

- Open the package.json file in the ‘auth’ directory
- Find the `start` script
- Update the start script to the following: `ts-node-dev --poll src/index.ts`

## Unsafe URL

Once the `ingress`service is setup you can test the running service:

- open Chrome browser
- go to the address: http://tickets.dev/api/users/currentuser
- Chrome will complain that the site is unsafe
  - this is an unskippable HTTPS warning in Chrome
  - to avoid the warning click anywhere in the page and type: **thisisunsafe**

## Validation library

In order to properly validate the data send by clients over HTTP we should do validation.
One npm module that could be used: `express-validator`:
`$ npm i express-validator`

## Postman errors

Got an error when testing the route handler in Postman? If so, do the following:

- open the Postman preferences
- find the setting called **SSL certificate verification**
- change this setting to **OFF**

## Abstract classes in TS

- they can not be instantiated
- used to set up requirements for subclasses
- do create a class when they are translated to JS, so they can be used in `instanceof` checks

## Async functions and errors

- if you mark a function as `async`, that function is no longer return immediately any value
- an `async` function will return a `Promise` that is going to resolve with some value in the future even if we throw an error inside the function
- this will affect the **express** error handling mechanism: https://expressjs.com/en/guide/error-handling.html
  - if we have an sync rout handler and we throw an error inside, **express** will catch the error on its own
  - for `async` route handlers we have to rely on the `next()` function instead

Examples:

```ts
// sync route handler
app.all('*', () => {
  throw new NotFoundError();
});
```

```ts
// async route handler
app.all('*', async (req, res, next) => {
  next(new NotFoundError());
});
```

- relying on the `next()` function is particular to **express**
- instead one could use the `express-async-errors` npm package that is going to change the default behavior of how **express** handles errors in the `async` route handlers:
  - it will actually ensure that **express** will await the async route handlers

How to use `express-async-errors`:

- install it: `$ npm i express-async-errors`
- import it right after `express` package

```ts
import express from 'express';
import 'express-async-errors';
//...
app.all('*', async () => {
  throw new NotFoundError();
});
```

# Disclaimer for the current service

- user auth with microservices is an unsolved problem
- there are many ways to do user auth, and no one is **_right_**

## The challenge

The challenge is that when a request comes from a user to a microservice, based on a JWR, Cookie, etc., that microservice should decide if that user is authenticated. In order to do so we have several options.

### Fundamental Option #1

Individual services rely on the **auth** service.
In this case the individual services can make **_sync_** requests to **auth** service.

NOTE: The **_sync_** request in the world of microservices, refers to a direct request from one service to another (one that does not make use of Events or EventBus).

Downsides (same as the downsides of a sync communication):

- all services work only if **auth** service works!

#### Fundamental Option #1.1

Individual services rely on the **auth** service as a gateway.
In this case all requests pass through **auth** service.

### Fundamental Option #2

Individual services know how to authenticate a user.
In this case, the logic to inspect JWT/Cookie and decide if the user is authenticated exists in each individual service.

Upsides:

- we do not have any outside dependency

Downside:

- we end up duplicating auth logic between services; this issue can be solved with a shared library
- for more info see: https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19119696

### Comparison between Option #1 and Option #2

Option #1:

- changes to auth state are immediately reflected
- !!! auth service goes down - the entire app is broken

Option #2:

- auth service is down - nobody cares
- !!! some user got banned - the user still has a valid token that can be used in other services

**NOTE:**

- **in the current implementation we will go with Option #2 just to stick with the idea of independent microservices. Still, we can use a an hybrid implementation with sync and async microservices communication.**
- more details in: https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19119722

# Cookies and JWT

## Cookies

- they are a transport mechanism between the browser and the server
- moves any kind of data between the browser and the server
- automatically managed by the browser

## JWT

- specially built for authentication and authorization
- stores any data we want
- we have to manage it manually
  - unless we are storing that JWT inside of a cookie

# Requirements for auth mechanism

- must be able to tell us details about the user
- must be able to handle authorization info
- must have a built-in, tamper resistant way to expire or invalidate itself
- must be easily understood between different languages
- must not require some kind of backing data store on server

NOTE: all the requirements above lead us to **JWT**

## Include the JWT in the HTTP request

One can choose between several places to include the JWT:

- in the **request header**
  - `Authorization`: `JWT`
- in the **request body**
  - `token`: `JWT`
- as a cookie in the **request header** (in this case we rely on the browser to manage the cookie)
  - `Cookie`: `JWT`

In order to choose the proper option you should take in consideration how the client app is built:

1. When implementing for example a normal React app the app is loaded in the browser, so js code is loaded and executed and only after that request for data is made from the browser. In this case all options to include the JWT are viable, since the JWT should be included only on data request.

2. When implementing for example a server-side rendered React app, that means that on the server side the app HTML is being build and the HTML includes also the data. In this case only using the JWT as cookie is viable since the JWT has to be provided on the initial request and should be used on server-side to request data that is included in the HTML.

**Conclusion: We will use JWT as authentication mechanism and we are going to manage this JWT through the use of cookies.**

Cookies:

- in order for the server to include a cookie in the response it will use the `Set-Cookie` header
- we will automatically manage the cookies using a helper library to read data out of the cookie: `cookie-session` (https://www.npmjs.com/package/cookie-session)
