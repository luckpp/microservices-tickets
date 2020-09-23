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
