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
