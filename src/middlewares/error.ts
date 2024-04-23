import { NextFunction, Request, Response } from "express"
import ErrorHandler from "../utils/utitlity-class.js";
import { ControllerType } from "../types/type.js";
export const errorMiddleware = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
    err.message ||= "Internal Server error"; // If message is not provided, set a default message
    err.statusCode ||= 500; // If statusCode is not provided, set a default status code
    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
}

export const TryCatch = (func: ControllerType) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(func(req, res, next)).catch(next);
};