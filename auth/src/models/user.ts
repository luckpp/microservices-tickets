import mongoose from 'mongoose';
import { Password } from '../services/password';

// An interface that describes the properties that are required to create a new User
interface UserAttrs {
  email: string;
  password: string;
}

// An interface that describes the properties that a User Model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// An interface that describes the properties that a User Document has
interface UserDoc extends mongoose.Document {
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

// this is a middleware function implemented in Mongoose
// notice that we use the 'function' keyword as opposed to the arrow function (done) => { ... }
//   - we do so since whenever we set up a middleware function we get access to the current document
//     using the 'this' keyword
//   - if we would have used an arrow function, than the value of this inside the function would have been
//     overwritten and would be equal to the context of the entire file where the function is located
userSchema.pre('save', async function (done) {
  // this avoids scenarios when we retrieve an user from DB, modify other properties than password and than save
  // in this case the pre save hook is executed but we do not hash the password again
  if (this.isModified('password')) {
    const hashed = await Password.toHash(this.get('password'));
    this.set('password', hashed);
  }
  done();
});

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
