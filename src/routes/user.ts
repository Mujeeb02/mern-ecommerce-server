import express from "express";
import { deleteUser, getAllUser, getUser, newUser } from "../controller/user.js";
import { adminOnly } from "../middlewares/auth.js";
const app=express.Router();

//routes

// route to post a new user in the database...
app.post("/new",newUser);

//route to getall user details present in the database...
app.get("/getall",adminOnly,getAllUser);

//route to get user by certain id...
// adminOnly authentication has been removed because it was nt sending data in front end code 
app.get("/:id",getUser);

//route to delete a user
app.delete("/delete/:id",adminOnly,deleteUser)
export default app;