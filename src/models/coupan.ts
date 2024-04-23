import mongoose from "mongoose";
const schema =new mongoose.Schema({
    code:{
        type:String,
        required:[true,"please enter valid coupan code"],
        unique:true,
    },
    amount:{
        type:Number,
        required:[true,"please enter the the Discount amount"],

    }  
})
export const Coupon=mongoose.model("Coupon",schema)