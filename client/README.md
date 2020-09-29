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
