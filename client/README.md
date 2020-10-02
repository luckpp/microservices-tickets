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

# Server side rendering (SSR)

Actions that happen behind the scenes when we make a request to our Next JS application:

- inspect URL of incoming request, determine set of components to show
- call those component's `getInitialProps` static method
- render each component with data from `getInitialProps` **one time**
- assemble HTML from all components, send back response

NOTES:

- `getInitialProps` is specific to Next JS
- if we decide to implement `getInitialProps`, Next JS is going to call it while attempting to render our application on the server
- `getInitialProps` is our opportunity to attempt fetch some data, that this component needs during the server side rendering process
- once `getInitialProps` is invoked, any data that we return from it, usually in the form of an object, is going to be provided to our component as a prop
- Next JS will assemble the HTML with all required components and sends back the response

```jsx
const LandingPage = ({ color }) => {
  console.log('I am in the component', color);
  return <h1>Landing Page</h1>;
};

LandingPage.getInitialProps = () => {
  console.log('I am on the server!');

  return { color: 'red' };
};

export default LandingPage;
```

NOTE: **Once our entire application is executed inside the browser, we are not concerned anymore with the `getInitialProps`, and we can continue to fetch data as usual inside the component.**

## Requests from getInitialProps to other services

Inside a Next JS application, during tha server side rendering process, data from other services might be required. In order to fetch data inside the `getInitialProps` from other services, one has two options.

### Option: Request data directly for other services

For example one could reach directly into: http://auth-srv/api/users/currentuser :

- **auth-srv** is the name of the Kubernetes service that governs access to the **auth** pod

NOTE: **This is not the best option since the Next JS app (the React client app) has to know the name of each service it wants to access.**

### Option: Request data through the ingress-nginx

NOTE:

- **When using this option, the ingress-nginx will figure it out where to send the requests based on the URL path**
- **ingress-nginx already has the set of routing rules that are configured in the `ingress-srv.yaml`**
  - it know how to take a request to an arbitrary endpoint and map it to the appropriate service and port

So requests will be made to: http://?????/api/users/currentuser

#### The challenges

The challenge are:

- to figure out how to make requests to ingress-nginx when we are inside the cluster
- to figure out a way, that when we make a request from Next JS, we take a look at the original incoming request:
  - extract the `cookie` from the original request
  - include the `cookie` in the request to ingress-nginx

Note: it is very important to customize the requests we make based on the environment:

- requests that come from a component
  - always issued from the browser, so we use a domain of ''
- requests from `getInitialProps`
  - might be executed from the client or the server and we need to figure out what env is so we can use the correct domain

Where and when is `getInitialProps` executed:

- executed on the **server**
  - on hard refresh of page
  - clicking link from different domain
  - typing URL into the address bar
- executed on the **client**
  - navigating from one page to another **_while in the app_**

**Conclusion:**

- when we make requests from the component we do not have to worry about the domain
- when we make requests from the `getInitialProps` we need to take care of the domain based on the environment from which the function is executed

#### Do cross namespace service communication

In order to make the call during the SSR to the proper domain inside `getInitialProps` you should take the following steps:

- `$ minikube addons enable ingress`
- `$ minikube addons enable metallb`
- `$ skaffold dev`
- open a new another terminal:
  - `$ kubectl expose deployment ingress-nginx-controller --target-port=80 --type=LoadBalancer -n kube-system`
- the above cmd will create ingress-nginx-controller service of type LoadBalancer under namespace kube-system. We can access it via "http://SERVICENAME.NAMESPACE.svc.cluster.local" as stated in the course. In my case, http://ingress-nginx-controller.kube-system.svc.cluster.local/api/users/currentuser (ref https://stackoverflow.com/questions/62162209/ingress-nginx-errors-connection-refused)

#### Including the cookie in the requests during SSR

When `getInitialProps` is called on the server, the first argument to the function is an object that is going to have a couple of properties inside. One of the properties is the `req` object, that is the same kind of object we expect to receive inside of an `express.js` application.

In order to make sure that all the headers received from the initial request (including the **_Host_** and **_Cookie_** header) reach into other services, one should include `req.headers` in the request made to the **ingress-nginx**.

```js
LandingPage.getInitialProps = async ({ req }) => {
  if (typeof window === 'undefined') {
    const { data } = await axios.get(
      'http://ingress-nginx-controller.kube-system.svc.cluster.local/api/users/currentuser',
      {
        headers: req.headers, // we forward all the headers received from the request; the Host & Cookie should be present there
      }
    );
    return data;
  } else {
    // we are on the browser: the browser prepends the domain
    const { data } = await axios.get('/api/users/currentuser');
    return data;
  }
};
```
