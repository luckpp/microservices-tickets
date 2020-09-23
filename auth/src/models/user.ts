import mongoose from 'mongoose';

// An interface that describes the properties that are required to create a new User
interface UserAttrs {
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('User', userSchema);

// solves Issue #1: TS should check the object passed into User
// - we will never call directly new User(...) inside of our code
// - we will always call buildUser(...)
const buildUser = (attrs: UserAttrs) => {
  return new User(attrs);
};

export { User, buildUser };
