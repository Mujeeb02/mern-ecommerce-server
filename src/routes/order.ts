import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { Orders, allOrders, deleteOrder, getSingleOrder, newOrder, processOrder } from "../controller/order.js";
const app=express.Router();
// route to post a new user in the database...
app.post("/new",newOrder);

app.get("/orders",Orders)

app.get("/allOrders",adminOnly,allOrders)

app.get("/single/:id",getSingleOrder)

app.put("/process/:id",adminOnly,processOrder)

app.delete("/delete/:id",adminOnly,deleteOrder)

export default app;