# Init

After installing `typescript` package we should create a **.tsconfig**:
`$ tsc --init`

## Notes

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

## Validation library:

In order to properly validate the data send by clienst over HTTP we should do validation.
One npm module that could be used: `express-validator`:
`$ npm i express-validator`

## Postman errors:

Got an error when testing the route handler in Postman? If so, do the following:

- open the Postman preferences
- find the setting called **SSL certificate verification**
- change this setting to **OFF**
