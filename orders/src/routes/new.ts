import express, { Request, Response } from 'express';
import mongoose, { mongo } from 'mongoose';
import { body } from 'express-validator';
import { requireAuth, validateRequest } from '@my-tickets/common';

const router = express.Router();

router.post(
  '/api/orders',
  requireAuth,
  [
    // we should not validate the type of the ticketId to be a MongoId since, in this way,
    // we will tightly couple with the DB type of the Ticket Service and that DB type can change in the future
    // we validate the type only to show how is done
    body('ticketId')
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('TicketId must be provided')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
  }
);

export { router as createOrderRouter };