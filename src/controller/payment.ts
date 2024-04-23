import { Request, Response, NextFunction } from "express";
import { Coupon } from "../models/coupan.js";
import { stripe } from "../app.js";


export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {amount } = req.body;
        console.log(amount)
        if (!amount) { // Adjusted condition
            return res.status(401).json({ success: false, message: "Please enter all the details carefully" });
        }
        const paymentIntent=await stripe.paymentIntents.create({amount:Number(amount)*100,currency:"INR"})
        return res.status(201).json({ success: true, clientSecret:paymentIntent.client_secret });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(400).json({ success: false, message: "Something went wrong" });
    }
};

export const newCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { coupon, amount } = req.body;
        console.log(coupon,amount)
        if (!coupon || !amount) { // Adjusted condition
            return res.status(401).json({ success: false, message: "Please enter all the details carefully" });
        }
        await Coupon.create({ code: coupon,amount }); // Assuming value is the field to store the coupon amount
        return res.status(201).json({ success: true, message: `Coupon ${coupon} created successfully` });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(400).json({ success: false, message: "Something went wrong" });
    }
};

export const applyDiscount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { coupon} = req.query;
        const coupondetails=await Coupon.findOne({code:coupon})
        console.log(coupondetails)
        if(!coupondetails){
            return res.status(401).json({ success: false, message: "Invalid Coupon COde" });
        }
        return res.status(201).json({ success: true, Discount:coupondetails.amount});
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(400).json({ success: false, message: "Something went wrong" });
    }
};

export const allCoupons= async (req: Request, res: Response, next: NextFunction) => {
    try {
        const coupons=await Coupon.find({})
        if(!coupons){
            return res.status(401).json({ success: false, message: "No Coupon available currently" });
        }
        return res.status(201).json({ success: true, Discount:coupons});
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(400).json({ success: false, message: "Something went wrong" });
    }
};

export const deleteCoupon= async (req: Request, res: Response, next: NextFunction) => {
    try {
        const{id}=req.params;
        const coupons=await Coupon.findByIdAndDelete(id)
        if(!coupons){
            return res.status(401).json({ success: false, message: "Not a valid coupon" });
        }
        return res.status(201).json({ success: true, message:"Coupon Deleted succesfully..."});
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(400).json({ success: false, message: "Something went wrong" });
    }
};

