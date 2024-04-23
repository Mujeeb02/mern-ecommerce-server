import {Request,Response, NextFunction } from "express";

export interface newuserRequestbody{
    _id:string;
    name:string;
    photo:string;
    email:string,
    role:string;
    gender:string;
    dob:Date;
}

export interface newproductRequestbody{
    name:string;
    price:Number;
    stock:Number;
    category:string;
}

export type ControllerType=(
    req: Request,
    res: Response,
    next: NextFunction
)=>Promise<void | Response<any,Record<string,any>> | undefined>

export type SearchRequestQuery={
    
    search?:string;
    price?:string;
    stock?:string;
    category?:string;
    sort?:string;
    page?:string;
}

export interface BaseQuery{
    name?:{
        $regex:string,
        $options:string
    };
    price?:{$lte:number};
    category?:string;
}

export type InvalidateCacheProps={
    product?:boolean;
    order?:boolean;
    admin?:boolean;
    userId?:string;
    orderId?:string;
    productId?:string;
}

export type OrderItemsType={
    name:string;
    photo:string;
    price:number;
    quantity:number;
    productId:string;
}

export type ShippingInfoType={
    address:string;
    city:string;
    state:string;
    country:string;
    pincode:number;
}

export interface NewOrderRequestBody{
    shippingInfo:ShippingInfoType;
    user:string;
    subtotal:number;
    tax:number;
    shippingCharges:number;
    discount:number;
    total:number;
    orderItems:OrderItemsType[];
}

import { Document, Types } from 'mongoose';

interface IOrderItem {
    name: string;
    photo: string;
    price: number;
    stock: number;
    quantity: number;
    productId: Types.ObjectId;
}

interface IOrder extends Document {
    shippingInfo: {
        address: string;
        city: string;
        state: string;
        country: string;
        pinCode: number;
    };
    user: string;
    subtotal: number;
    tax: number;
    shippingCharges: number;
    discount: number;
    total: number;
    status: "Processing" | "Shipped" | "Delivered";
    orderItems: IOrderItem[];
    createdAt: Date; // Add createdAt property
    updatedAt: Date; // Add updatedAt property
}

export default IOrder;
