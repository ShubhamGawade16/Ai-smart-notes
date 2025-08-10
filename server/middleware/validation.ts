import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  createOrder: z.object({
    planType: z.enum(['basic', 'pro'], {
      required_error: 'Plan type is required',
      invalid_type_error: 'Plan type must be either basic or pro'
    })
  }),
  
  verifyPayment: z.object({
    razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
    razorpay_order_id: z.string().min(1, 'Order ID is required'),
    razorpay_signature: z.string().min(1, 'Signature is required')
  }),
  
  createTask: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
  })
};