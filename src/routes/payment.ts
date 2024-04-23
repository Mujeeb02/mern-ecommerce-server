import express, { Request, Response, NextFunction } from "express";
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from "../controller/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post("/create",createPaymentIntent)

app.get("/discount",applyDiscount)

app.post("/coupon/new",adminOnly, newCoupon);

app.get("/coupon/all",adminOnly,allCoupons);

app.delete("/coupon/delete/:id",adminOnly,deleteCoupon)

export default app;
