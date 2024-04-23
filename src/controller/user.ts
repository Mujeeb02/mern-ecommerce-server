import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.js";
import { newuserRequestbody } from "../types/type.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utitlity-class.js";


export const newUser = TryCatch(
    async (
        req: Request,
        res: Response,
        next: NextFunction) => {

        try {
            const { name, photo, _id, gender, role, dob, email } = req.body;
            if (!_id || !name || !photo || !gender || !role || !dob || !email) {
                return next(new ErrorHandler("Please add all fields first..", 400))
            }
            let usercheck = await User.findById(_id);

            if (usercheck) {
                res.status(200).json({
                    success: true,
                    message: `welcome ${name}`
                })
            }

            const user = await User.create({ name, photo, _id, gender, role, dob: new Date(dob), email });
            res.status(200).json({
                success: true,
                message: `welcome ${user.name}`
            })
        } catch (error) {
            next(error);
        }
    }
)

export const getAllUser = TryCatch(async (req, res, next) => {
    try {
        const users = await User.find({}); // Await the query operation
        return res.status(200).json({
            success: true,
            users: users, // Send the actual users data
        });
    } catch (error) {
        next(error); // Forward errors to error handling middleware
    }
});

export const getUser = TryCatch(async (req, res, next) => {
    try {
        const id=req.params.id;
        const user = await User.findById(id); // Await the query operation
        if(!user){
            return res.status(501).json({
                success:false,
                message:"User has not registeres yet..."
            })
        }
        return res.status(200).json({
            success: true,
            users: user, // Send the actual users data
        });
    } catch (error) {
        next(error); // Forward errors to error handling middleware
    }
});
export const deleteUser = TryCatch(async (req, res, next) => {
    try {
        const id=req.params.id;
        const user = await User.findById(id); // Await the query operation
        if(!user){
            return res.status(501).json({
                success:false,
                message:"User has not registeres yet..."
            })
        }
        await user.deleteOne();

        return res.status(200).json({
            success: true,
            message:"User has been deleted succesfully...", // Send the actual users data
        });
    } catch (error) {
        next(error); // Forward errors to error handling middleware
    }
});