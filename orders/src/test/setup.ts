import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

declare global {
  namespace NodeJS {
    interface Global {
      signin(): string[];
    }
  }
}

// relative path to the file to fake and for which jest will redirect imports to __mock__/nats-wrapper
jest.mock('../nats-wrapper');

let mongo: any;

beforeAll(async () => {
  process.env.JWT_KEY = 'asdf';
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  // ensure that all mock function counters are reset so we do not pollute one test from another
  jest.clearAllMocks();

  const collections = await mongoose.connection.db?.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.signin = () => {
  // Build a JWT payload: { id, email}
  const payload = {
    id: mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  };

  // Create JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build session Object: { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn that session into JSON string.
  const sessionString = JSON.stringify(session);

  // Take JSON and encode it as base64.
  const base64 = Buffer.from(sessionString).toString('base64');

  // Return the string that is the cookie with the encoded data.
  // NOTE: when we use supertest we have to include all the cookies in an array.
  return [`express:sess=${base64}`];
};
