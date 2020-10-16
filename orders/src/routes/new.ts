import express, { Request, Response } from 'express';
import mongoose, { mongo } from 'mongoose';
import { body } from 'express-validator';
import {
  BadRequestError,
  NotFoundError,
  OrderStatus,
  requireAuth,
  validateRequest,
} from '@my-tickets/common';
import { Ticket } from '../models/ticket';
import { Order } from '../models/order';

const router = express.Router();

router.post(
  '/api/orders',
  requireAuth,
  [
    // We should not validate the type of the ticketId to be a MongoId since, in this way,
    // we will tightly couple with the DB type of the Ticket Service and that DB type can change in the future
    // we validate the type only to show how is done
    body('ticketId')
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('TicketId must be provided'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body;

    // Find the ticket the user is trying to order in the DB
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    // Make sure that the ticket is not already reserved.
    // Run query to look at all orders and find an order where the ticket
    // is the ticket we just found *and* the order status is *not* canceled.
    // If we find an order that means the ticket *is* reserved.
    const existingOrder = await Order.findOne({
      ticket: ticket, // mongoose will make sure to pull out the ticketId and use it in the mongo query
      status: {
        $in: [
          OrderStatus.AwaitingPayment,
          OrderStatus.Created,
          OrderStatus.Complete,
        ],
      },
    });
    if (existingOrder) {
      throw new BadRequestError('Ticket is already reserved');
    }

    // Calculate an expiration date for this order
    // Build the order and save it to DB
    // Publish an event saying that an order was created
  }
);

export { router as createOrderRouter };
