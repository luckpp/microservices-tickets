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

`$ npm i cookie-session @types/cookie-session`

NOTE:

- the cookie will be sent to UI in base64 format. In order to decode it use https://www.base64decode.org/
- in order to verify the JWT inside the cookie go to https://jwt.io/ and input first your secret and than the token to be verified

In order to create a secret inside the Kubernetes cluster run:
`$ kubectl create secret generic jwt-secret --from-literal=JWT_JEY=asdf`

# Testing

In order to wire up the testing components several steps have to be done:

- update the `package.json` with a new script: `npm run test`
- when running the command above start a test runner called **Jest** (Jest is the library that we will use to execute tests inside of our project); as a consequence, Jest will do the following steps:
  - start an in-memory copy of MongoDB (no MOngoDB should be installed)
  - start up our `express` app
  - use **supertest** library to make fake requests tou our express app (that is why we need to expose the app)
  - run assertions to make sure the requests did the right thing

Install the following packages as dev dependencies:
`$ npm i --save-dev @types/jest @types/supertest jest ts-jest supertest mongodb-memory-server`

Update the package.json with the following npm script:
`"test": "jest --watchAll --no-cache"`

- --watchAll: will re-run all the tests inside the project whenever file changes
- --no-cache: jest does not have TS and will have difficulties understand when a TS file changes

Update the package.json with the jest configuration:

```json
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "setupFilesAfterEnv": [
      "./src/test/setup.ts"
    ]
  },
```

Update the `./src/test/setup.ts` with the setup required before running tests.

NOTE:

- the jest convention is that whenever you want to test a file for example **signup.ts** you make a folder on the same level called \***\*test\*\*** and add inside this folder a file called **signup.test.ts**
- make sure to define all environment variables used inside the code that is under test
- **jest** does not have support for TypeScript out of the box, and that is the reason we use the **ts-jest** library which gives jest the ability to understand TypeScript; still one of those tools (jest or ts-jest) do not detect changes made to the `*.ts` files -> so you will have to restart jest

Example of test:

```ts
it('returns a 400 with missing email and password', async () => {
  // you could either return the request and jest will await it for us
  // or you could await it yourself
  await request(app).post('/api/users/signup').send({}).expect(400);
});
```

NOTE:

- when running the test environment, **jest** sets an the `NODE_ENV` environment variable to `'test'`:

```ts
process.env.NODE_ENV === 'test';
```

Below there is an example of how one can handle cookies:

```ts
import request from 'supertest';
import { app } from '../../app';

it('responds with details about the current user', async () => {
  const authResponse = await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  const cookie = authResponse.get('Set-Cookie');

  const response = await request(app)
    .get('/api/users/currentuser')
    .set('Cookie', cookie)
    .send()
    .expect(200);

  expect(response.body.currentUser.email).toEqual('test@test.com');
});
```

## Mocking

In order to mock imports with Jest do the following steps:

- find the file that we want to 'fake'/mock
- in the same directory, create a folder called `__mocks__`
- in that folder, create a file with an identical name to the file we want to fake
- write a fake implementation
- tell `jest` to use that fake file in our test file:

```js
// inside the test file
// this implementation is done inside tickets project src/routes/__test__/new.test.ts
// ...
jest.mock('../../nats-wrapper'); // relative path to the file to fake and for which jest will redirect imports to __mock__/nats-wrapper
```

- alternatively to the last option we could tell `jest` to use that fake file in our test `setup.ts` file:

```js
// inside the test/setup.ts file
// this implementation is done inside tickets project src/test/setup.ts
// ...
jest.mock('../nats-wrapper'); // relative path to the file to fake and for which jest will redirect imports to __mock__/nats-wrapper
```
