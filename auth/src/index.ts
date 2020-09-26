import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import mongoose from 'mongoose';
import cookieSession from 'cookie-session';

import { currentUserRouter } from './routes/current-user';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './errors/not-found-error';

const app = express();
// Note that traffic is proxied to our application through ingress-nginx
// express will see that the traffic is proxied and by default will say that it will not trust the HTTPS connection
// so we have to prevent that by setting the parameter below to make express aware that is behind a proxy
// and to make sure that express will trust the traffic as being secured even if it is coming from that proxy
app.set('trust proxy', true);
app.use(json());
app.use(
  cookieSession({
    signed: false, // we will not use encryption since we have encryption in JWT
    secure: true, // cookies will be used only if the user is visiting our application over HTTPS connection
  })
);

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

// or could be only app.get()
app.all('*', async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
  }

  try {
    await mongoose.connect('mongodb://auth-mongo-srv:27017/auth', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Connected to MongoDb');
  } catch (err) {
    console.error(err);
  }

  app.listen(3000, () => {
    console.log('Listening on port 3000!');
  });
};

start();
