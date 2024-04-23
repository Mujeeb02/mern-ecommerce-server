import express from "express";
import { deleteUser, getAllUser, getUser, newUser } from "../controller/user.js";
import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAdminProducts, getAllProducts, getCategories, getLatestProducts, getSingleProduct, newProduct, updateProduct } from "../controller/product.js";
import { singleUpload } from "../middlewares/multer.js";
const app=express.Router();
const chekexisting=()=>{
    console.log("Here I am ")
}
//routes
app.post("/new",singleUpload,newProduct)

app.get("/latest",getLatestProducts)

app.get("/category",getCategories)

app.get("/admin-products",adminOnly,getAdminProducts)

//to get all the products with filter...
app.get("/all",getAllProducts);

app.put("/update/:id",adminOnly,singleUpload,updateProduct);

app.delete("/delete/:id",adminOnly,deleteProduct);

app.get("/:id",getSingleProduct);

export default app;