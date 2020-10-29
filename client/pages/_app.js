import 'bootstrap/dist/css/bootstrap.css';

import buildClient from '../api/build-client';
import Header from '../components/header';

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
      <Header currentUser={currentUser} />
      <div className="container">
        <Component currentUser={currentUser} {...pageProps} />
      </div>
    </div>
  );
};

AppComponent.getInitialProps = async (appContext) => {
  const client = buildClient(appContext.ctx);
  const { data } = await client.get('/api/users/currentuser');

  let pageProps = {};
  if (appContext.Component.getInitialProps) {
    // We pass `client` as a second argument to each component in order to avoid recreating the `client`
    // before each request we want to make.
    // We pass the `user` as a third argument since whenever we will further want to fetch some data related
    // to the user, we want to understand who the user is.
    pageProps = await appContext.Component.getInitialProps(
      appContext.ctx,
      client,
      data.currentUser
    );
  }

  return {
    pageProps,
    currentUser: data.currentUser, // or simply use ...data to destructure the object containing the currentUser
  };
};

export default AppComponent;
