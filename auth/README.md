# Init

After installing `typescript` package we should create a **.tsconfig**:
`$ tsc --init`

## Notes for server restart

If all Kubernetes and Skaffold config files have been properly defined you should start `skaffold dev`.

If you did not see your server restart after changing the index.ts file, do the following:
- Open the package.json file in the ‘auth’ directory
- Find the `start` script
- Update the start script to the following: `ts-node-dev --poll src/index.ts`