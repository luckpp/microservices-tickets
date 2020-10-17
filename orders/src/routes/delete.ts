import express, { Request, Response } from 'express';
import { param } from 'express-validator';
import mongoose from 'mongoose';
import {
  NotAuthorizedError,
  NotFoundError,
  requireAuth,
  validateRequest,
} from '@my-tickets/common';
import { Order, OrderStatus } from '../models/order';

const router = express.Router();

router.delete(
  '/api/orders/:orderId',
  requireAuth,
  [param('orderId').custom((input) => mongoose.Types.ObjectId.isValid(input))],
  validateRequest,
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.currentUser!.id;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }
    if (order.userId !== userId) {
      throw new NotAuthorizedError();
    }

    order.status = OrderStatus.Cancelled;
    await order.save();

    // publishing an event saying this was cancelled

    res.status(204).send(order);
  }
);

export { router as deleteOrderRouter };
