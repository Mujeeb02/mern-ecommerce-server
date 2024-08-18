import express from "express";
import userRoute from "./routes/user.js"
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import productRoute from "./routes/product.js"
import NodeCache from "node-cache";
import orderRoute from "./routes/order.js"
import { config } from "dotenv";
import morgan, { Morgan } from "morgan";
import couponRoute from "./routes/payment.js"
import statsRoute from "./routes/stats.js"
import Stripe from "stripe";
import cors from "cors";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config({ path: "./.env" });

// Configure Cloudinary with environment variables
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const port = process.env.PORT || 5000;
const stripeKey=process.env.STRIPE_Key || ""
const mongoURL = process.env.MONGO_URL || "";
const app = express();

connectDB(mongoURL);
app.use(cors())
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("api working now baby...")
})

export const stripe=new Stripe(stripeKey)
export const mynodecache=new NodeCache();
app.use(errorMiddleware)

//use Morgan to log requests to the console, a file, or a remote logging service.
app.use(morgan("dev"))
//using routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product",productRoute);
app.use("/api/v1/order",orderRoute);
app.use("/api/v1/payment",couponRoute)
app.use("/api/v1/stats",statsRoute)
app.use("/uploads",express.static("uploads"))
app.listen(port, () => {
    console.log(`app started at server ${port}`)
})
