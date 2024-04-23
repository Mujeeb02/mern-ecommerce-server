import { Request, Response } from "express";
import { NextFunction } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/type.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import { Product } from "../models/product.js";
import { mynodecache } from "../app.js";
import ErrorHandler from "../utils/utitlity-class.js";

export const newOrder = TryCatch(async (req: Request<{}, {}, NewOrderRequestBody>, res: Response, next: NextFunction) => {
  const { shippingInfo, shippingCharges, orderItems, user, subtotal, tax, discount, total } = req.body;
  try {
    const newOrder = new Order(
      {
        shippingInfo, shippingCharges, orderItems, user, subtotal, tax, discount, total
      }
    )
    // if (!shippingInfo || !shippingCharges || !orderItems || !user || !subtotal || !tax || !discount || !total) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Please enter all fields"
    //   })
    // }
    await newOrder.save();
    await reduceStock(orderItems);
    await invalidateCache({ order: true, product: true, admin: true })
    return res.status(201).json({
      success: true,
      message: "order placed succesfully...",
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
});

export const Orders = TryCatch(async (req, res: Response, next: NextFunction) => {
  try {
    const { id: user } = req.query;

    const key = `my-orders-${user}`;

    let orders = [];

    if (mynodecache.has(key)) orders = JSON.parse(mynodecache.get(key) as string);
    else {
      orders = await Order.find({ user });
      mynodecache.set(key, JSON.stringify(orders));
    }
    return res.status(200).json({
      success: true,
      orders,
    });
  }
  catch (error) {
    next(error);
  }
});

export const allOrders = TryCatch(async (req, res: Response, next: NextFunction) => {
  try {

    const key = `all-orders`
    let orders = []
    if (mynodecache.has(key)) {
      orders = JSON.parse(mynodecache.get(key) as string);
    }
    else {
      orders = await Order.find().populate("user", "name");
      mynodecache.set(key, JSON.stringify(orders))
    }
    return res.status(201).json({
      success: true,
      message: "order fetched succesfully...",
      orders
    });
  }
  catch (error) {
    next(error);
  }
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `order-${id}`;
  let order;
  if (mynodecache.has(key)) order = JSON.parse(mynodecache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name");
    if (!order) return next(new ErrorHandler("Order Not Found", 404));
    mynodecache.set(key, JSON.stringify(order));
  }
  return res.status(200).json({
    success: true,
    order,
  });
});

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  await order.deleteOne();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
