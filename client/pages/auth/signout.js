import { useEffect } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

// as soon as this component is rendered we will use the 'useEffect' hook
// to try to make a request to sign the user out and once the user is signed out
// we will navigate to the landing page
export default () => {
  const { doRequest } = useRequest({
    url: '/api/users/signout',
    method: 'post',
    body: {},
    onSuccess: () => Router.push('/'),
  });

  useEffect(() => {
    doRequest();
  }, []); // we put an empty array since we want to call this only one time

  return <div>Signing you out...</div>;
};
