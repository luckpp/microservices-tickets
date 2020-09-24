import { scrypt, randomBytes } from 'crypto'; // scrypt -> is the hashing function; it is allback-based
import { promisify } from 'util'; // will be used to convert the scrypt(...) function to a promise based implementation

const scryptAsync = promisify(scrypt);

export class Password {
  static async toHash(password: string) {
    const salt = randomBytes(8).toString('hex');
    const buffer = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${buffer.toString('hex')}.${salt}`;
  }

  static async compare(storedPassword: string, suppliedPassword: string) {
    const [hashedPassword, salt] = storedPassword.split('.'); // see the toHash(...) method to see its return value
    const buffer = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

    return buffer.toString('hex') === hashedPassword;
  }
}
