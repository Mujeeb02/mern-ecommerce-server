import { User } from "../models/user.js";
import ErrorHandler from "../utils/utitlity-class.js";
import { TryCatch } from "./error.js";

export const adminOnly=TryCatch(async (req,res,next)=>{
    const {id}=req.query;
    if(!id){
        return next(new ErrorHandler("No Id received ",401));
    }
    const user =await User.findById(id);
    if(!user){
        return next(new ErrorHandler(`user with id ${id} is not available`,401));
    }
    if(user.role!=="admin"){
        return next(new ErrorHandler(`u are not authorized to do so...`,401));
    }
    next();
})