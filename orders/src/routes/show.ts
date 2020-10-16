import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { param } from 'express-validator';
import {
  NotAuthorizedError,
  NotFoundError,
  requireAuth,
  validateRequest,
} from '@my-tickets/common';
import { Order } from '../models/order';

const router = express.Router();

router.get(
  '/api/orders/:orderId',
  requireAuth,
  [
    param('orderId')
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('OrderId incorrect format'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const userId = req.currentUser!.id;
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId).populate('ticket');

    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== userId) {
      throw new NotAuthorizedError();
    }

    res.send(order);
  }
);

export { router as showOrderRouter };
