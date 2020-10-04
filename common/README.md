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

## Writing the library/package using TypeScript

- We will write the `common` package using TypeScript. There might be situations when clients of the library/package might use a different version of TypeScript or they might use JavaScript.
- **In order to avoid incompatibilities, the `common` library will be transpiled to JavaScript before being published to NPM.**
- We will write TypeScript and publish JavaScript

### Steps

1. Set-up a TypeScript environment:

- `$ npm i -g typescript`
- or if you are on a linux environment: `$ sudo apt install node-typescript`

2. Generate a TypeScript config file:

- `$ tsc --init`

3. Install `typesript` package and `del-cli` package as development dependencies:

- `$ npm i typescript del-cli --save-dev`
- we install the packages as development dependencies since we do not want to install them when adding the `common` package into other packages

4. Set-up the build process to turn TS code into JS code:

- update `package.json` and add a script to build the code using the TS compiler

```json
  "scripts": {
    "clean": "del ./build/*",
    "build": "npm run clean && tsc"
  }
```

- inside `tsconfig.json` file provide the configuration to TypeScript in order to tell it where to find our source code and tell it where to place it after it has been turned to JS; you will have to add/uncomment the following options from `tsconfig.json`:
  - `"declaration": true` (will ensure that a type definition file will be generated for cases when the `common` library/package will be used from a TS package)
  - `"outDir": "./build"` (so after generating our JS code, the result will be placed in the build folder)

5. Build everything:

- `npm run build`
