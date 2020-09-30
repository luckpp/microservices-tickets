# React App

We have two possibilities of building the react app

## Traditional approach

In the traditional approach the flow for displaying the React App is the following:

- browser requests the index.html
- inside index.html there might be references to \*.js script files
- browser requests the referenced \*.js files
- browser starts to execute the \*.js files and as result might request additional data from the server
  => there might be at least 2-3 requests to the server in order to show some data to the user

## Server-side rendering approach

In the server-side rendering:

- browser makes a request to our Next JS development server
  - Next JS is the framework that willbe used in order to implement the server-side rendering easily
- Next JS is going to internally make a couple of requests to different services to fetch data
- Next JS is goinng to take that data and build out a full HTML document that has a load of data rendered into it

Reasons for using server-side rendering:

- users will see content appearing on the screen much more quickly, particularlly on mobile devices
- server side rendered applications tend to work better with search engine optimization

# Creating and running the Next JS app

- create the 'client' folder
- \$ npm i react reac-dom next
- in order to set up routing inside a Next JS project, we will have a particular set of routes/files with very particular file names inside the 'pages' folder
  - index.js is the root path (http://localhost:3000/)
  - banana.js is a sub-route (http://localhost:3000/banana)
- add the following npm scrip to packae.json: "dev": "next"
- execute: npm run dev

NOTE: 'pages' folder and file names inside map to actual routes

# Run the Next JS app inside of our Kubernetes cluster

- create the `Dockerfile`
- create the Kubernetes deployment file for Deployment and Service
- create the corresponding entry in the Skaffold config file
- update the **ingress** configuration

# Next JS and file change detection

- at some points in time, when running your app with Skaffold, you might notice that Next JS might have problems detecting file changes
- so Next JS is a little bit 'finicky' with file change detection when it is running inside of a docker container

How to solve the issue above:

- create a file called `next.config.js` that is automatically loaded by Next JS when our project starts up
- inside the file we will change an option that will tell WebPack that rather than watching for file changes in an automated fashion, it should poll all the files inside our project directory, automatically once 300 ms

```js
// inside next.config.js
module.exports = {
  webpackDevMiddleware: (config) => {
    config.watchOptions.poll = 300;
    return config;
  },
};
```
