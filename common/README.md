# common package

Contains common logic that will be shared across all microservices.
This package will be published as npm public package inside `my-tickets` organization: https://www.npmjs.com/package/@my-tickets/common

# Notes on publishing npm packages

When we publish an npm package we have 3 options:

1. publish to NPM **Public** Registry
   - anyone can see the package by default
2. publish to NPM **Public** Registry inside of an **Organization**
   - only people member of the Organization can see the packages
   - note that for this option extra money have to be paid to NPM
3. publish to NPM **Private** Registry
   - access will be limited to whoever you give access to
   - you can create a private registry through NPM but you end up paying money
   - you can host your open-source version of NPM registry

I have chosen the Option #2 and created a Public Organization:

- the Public Organization is free as opposed to Private Organization
- link to create an Organization: https://www.npmjs.com/org/create
- the Organization name I have chosen is 'my-tickets', and it has to be unique through-out NPM Repository

## Publishing a package to 'my-tickets' organization

- in `package.json` include the name of the organization in the package name:

```json
{
  "name": "@my-tickets/common"
  // ...
}
```

- in order to publish a package we have to have everything inside the package directory committed to git (npm is going to check our git repo created inside this folder and make sure that everything is committed before we attempt to publish it)

  - `$ git init` (create a new git repository)
  - `$ git add .` (add everything inside the folder)
  - `$ git commit -m "initial commit"`

- login to NPM with your user:

  - `$ npm login`

- publish the package to NPM:
  - `$ npm publish --access public`
