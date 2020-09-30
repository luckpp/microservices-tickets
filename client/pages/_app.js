import 'bootstrap/dist/css/bootstrap.css';

// explanation: whenever you try to navigate to some distinct page with Next JS,
// Next JS is going to import your component from one of the pages/* files
// and wraps it inside its own custom default component and that is referred to inside Next JS
// as the app

// what we have done here in this file is we have defined our custom app component

// we do this since whenever we want to include some global CSS, we can import it only in the app file

export default ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};
