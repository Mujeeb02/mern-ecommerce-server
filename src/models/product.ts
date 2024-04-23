import mongoose from "mongoose";
const schema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter name"]
    },
    photo:{
        type:String,
        required:[true,"please enter photo"]
    },
    price:{
        type:Number,
        required:[true,"Please enter price"]
    },
    stock:{
        type:Number,
        required:[true,"Please enter stock number"]
    },
    category:{
        type:String,
        required:[true,"Please enter category of the product"],
        trim:true,
    },
    
},{timestamps:true})
export const Product=mongoose.model("Product",schema)