import 'bootstrap/dist/css/bootstrap.css';

import buildClient from '../api/build-client';

// explanation: whenever you try to navigate to some distinct page with Next JS,
// Next JS is going to import your component from one of the pages/* files
// and wraps it inside its own custom default component and that is referred to inside Next JS
// as the app

// what we have done here in this file is we have defined our custom app component

// we do this since whenever we want to include some global CSS, we can import it only in the app file

// We avoided with purpose using the name App
const AppComponent = ({ Component, pageProps, currentUser }) => {
  return (
    <div>
      <h1>Header! {currentUser.email}</h1>
      <Component {...pageProps} />{' '}
    </div>
  );
};

AppComponent.getInitialProps = async (appContext) => {
  const client = buildClient(appContext.ctx);
  const { data } = await client.get('/api/users/currentuser');

  let pageProps = {};
  if (appContext.Component.getInitialProps) {
    pageProps = await appContext.Component.getInitialProps(appContext.ctx);
  }

  return {
    pageProps,
    currentUser: data.currentUser, // or simply use ...data to destructure the object containing the currentUser
  };
};

export default AppComponent;
