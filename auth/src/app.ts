import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError } from '@my-tickets/common';

import { currentUserRouter } from './routes/current-user';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';

const app = express();
// Note that traffic is proxied to our application through ingress-nginx
// express will see that the traffic is proxied and by default will say that it will not trust the HTTPS connection
// so we have to prevent that, by setting the parameter below to make express aware that is behind a proxy
// and to make sure that express will trust the traffic as being secured even if it is coming from that proxy
app.set('trust proxy', true);
app.use(json());
app.use(
  cookieSession({
    signed: false, // we will not use encryption since we have encryption in JWT
    // secure: true, // cookies will be used only if the user is visiting our application over HTTPS connection
    secure: process.env.NODE_ENV !== 'test', // instead of had-coding 'true' like above, we allow cookies except when being in the test environment
  })
);

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

// we send NotFoundErrors for routes that are not registered
app.all('*', async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
