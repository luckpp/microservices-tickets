# Documentation

There are two approaches to use Git or another versioning system with a microservices project:

1. Mono Repo Approach (Single Git Repository)

- we can track changes made to all of our services
- **very large companies use this approach**

2. Repo-Per-Service Approach

- there is a load of overhead with this approach
  - create a separate repository on **Github** or **Gitlab**
  - create a separate set of authentication keys
  - set up a separate CI and CD pipeline

How to create a Git repository from our project folder:

1. Go to the root of the project:

- run `git init`
- create a `.gitignore file`
- run `git add`
- run `git commit -m "initial commit"`
- by now we have an up-to-date Git repository on our machine

2. Go to Github and create a matching repository

- go to https://github.com/ and make sure you are logged-in
- create a new repository
- tie this Github repository with the repository from the local machine:
  - copy the Github repository URL (im my case https://github.com/luckpp/microservices-tickets.git)
  - on local machine in the root of the project run: `git remote add origin {Github_repository_URL}`

3. Push your changes

- run `git push origin master`
- (\*) make sure you have your git client set up to work with Github appropriately (eg. you have matching SSH keys -> Github offers help doc in this direction)

# Github Actions

Any time an action occurs in a Github repository an Event is triggered inside Github and based on that we can **run a Github action**. Examples of events:

- Code pushed
- Pull request created
- Pull request closed
- Repository is forked
- ...

**A Github action is a actually a script in which we can put code to:**

- run commands
- run tests
- deploy the app
- ...

Reference:

- https://docs.github.com/en/free-pro-team@latest/actions
- https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19989344

## Example of github action

A Github action can be defined from the Github repository page.

```yaml
name: test # name of the Github action

on: pull_request # the event that will trigger the action

jobs: # defines the things we want to do whenever a pull_request is created, reopened or updated
  build:
    runs-on: ubuntu-latest # we start a container
    steps:
      - uses: actions/checkout@v2 # we will take all the code out of our project
      - run: cd auth && npm install && npm run test:ci # the series of commands that will run inside of our project
```

NOTE: In `auth` project we have added a `test:ci` npm script in order to make sure that the tests are not run in watch mode and are run only once.

## How to commit the code

- `$ git status` allows to see the files that have been changed
- `$ git add .` to add those files to the next commit
- `$ git commit -m "added CI test script"` to commit
- `$ git pull origin master` to pull any existing changes (optional)
- `$ git push origin master` to push the commit to the master branch

## Testing the CI flow

### 1. Make a change in the code

- in `auth/src/index.js` add a line of code, eg.: `console.log('Starting up...');`

### 2. Commit code to a git branch

- `$ git checkout -b dev` to checkout a branch called dev
- `$ git status`
- `$ git add .`
- `$ git commit -m "added startup message"`

### 3. Push branch to Github

- `$ git push origin dev`

### 4. Github receives updated branch

- as a result of the previous command. Github receives updated branch

### 5. Manually create a pull request to merge branch into master

- go to Github repository page:
  - select **Pull request -> New pull request**
  - select the appropriate branches (`master` <- `dev`)
  - select **Create pull request**
  - add a comment
  - select **Create pull request**
  - now all steps for installing and running tests should run

### Testing all services

In order to test all the services on **pull request** we have 2 options:

- For each service add a `run` step inside `/.github/workflows/tests.yaml` Github action file:
  - in this case all steps are run sequentially
- For each service create inside `/.github/workflows/` a separate Github action file:
  - in this case all tests are run in parallel (better option)

NOTE: Sometimes,when you add a new workflow, Github does not want to process it right away. So if noting happens for more than 5 minutes you should cancel the current workflow, go to your branch, do a change, commit and push the change and tahn Github will execute all the workflows for your pull request.

A workflow file should run only when changes are done to code that is under test. For example it would be a waste of resources tu run tests for `auth service` when we have pushed changes related to `orders service`
