import axios from 'axios';

/**
 * The purpose of this method is to create an instance of axios that is pre-configured to work
 * either on the server or the browser
 */
export default ({ req }) => {
  if (typeof window === 'undefined') {
    // we are on the server
    return axios.create({
      // the line below should be un-commented when running code with `skaffold`
      baseURL: 'http://ingress-nginx-controller.kube-system.svc.cluster.local',
      // baseURL: 'http://www.luckpp-tickets.xyz',
      headers: req.headers,
    });
  } else {
    // we are on the browser
    return axios.create({
      baseURL: '/', // this can be left out entirely since the browser is taking care of configuring everything
    });
  }
};
