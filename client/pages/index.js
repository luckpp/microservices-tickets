import axios from 'axios';

const LandingPage = ({ currentUser }) => {
  console.log('LoadingPage component', currentUser);

  return <h1>Landing Page</h1>;
};

LandingPage.getInitialProps = async ({ req }) => {
  if (typeof window === 'undefined') {
    // we are on the server
    // -------------------------------------------
    // this works, still it is a sync call to a service
    // const { data } = await axios.get(
    //   'http://auth-srv:3000/api/users/currentuser'
    // );
    // -------------------------------------------
    // -------------------------------------------
    // this does not work, it uses an external name
    // const { data } = await axios.get(
    //   'http://ingress-internal-srv/api/users/currentuser',
    //   {
    //     headers: {
    //       Host: 'tickets.dev', // we set the same host as the one defined in ingress-srv.yaml in order to pass the routing rules
    //     },
    //   }
    // );
    // -------------------------------------------
    // -------------------------------------------
    // this does work: more info on: https://stackoverflow.com/questions/62162209/ingress-nginx-errors-connection-refused
    const { data } = await axios.get(
      'http://ingress-nginx-controller.kube-system.svc.cluster.local/api/users/currentuser',
      {
        // headers: {
        //   Host: 'tickets.dev', // we set the same host as the one defined in ingress-srv.yaml in order to pass the routing rules
        // },
        headers: req.headers, // we forward all the headers received from the request; the Host & Cookie should be present there
      }
    );
    // -------------------------------------------
    return data;
  } else {
    // we are on the browser: the browser prepends the domain
    const { data } = await axios.get('/api/users/currentuser');
    return data;
  }
};

export default LandingPage;
