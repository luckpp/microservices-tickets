import { CustomError } from './custom-error';

export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(public message: string) {
    super(message);
    // super(this.message) can not be use since super() executes before TS converts the message
    // to a property of the class
    // after the call to super(), this.message can be used

    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
