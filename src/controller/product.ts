import { BaseQuery, SearchRequestQuery, newproductRequestbody, newuserRequestbody } from "../types/type.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utitlity-class.js";
import { Product } from "../models/product.js";
import { Request, Response, NextFunction } from "express";
import { rm } from "fs";
import { promises } from "dns";
import { mynodecache } from "../app.js";
import { invalidateCache } from "../utils/features.js";
import cloudinary from "cloudinary"
export const newProduct = TryCatch(
    async (
        req: Request<{}, {}, newproductRequestbody>,
        res: Response,
        next: NextFunction
    ) => {
        const { name, price, stock, category } = req.body;
        const imageFiles = req.files as Express.Multer.File[];

        if (!imageFiles || imageFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please add photo(s)",
            });
        }

        if (!name || !price || !stock || !category) {
            imageFiles.forEach((file) => {
                rm(file.path, () => {
                    console.log("Image not saved in storage...");
                });
            });
            return next(new ErrorHandler("Please add all fields first.", 400));
        }

        // Upload images to Cloudinary
        const imageUrls = await uploadImages(imageFiles);

        const product = await Product.create({
            name,
            photo: imageUrls[0], // Assuming the first image is the main photo
            price,
            stock,
            category: category.toLowerCase(),
            images: imageUrls, // If your schema includes multiple images
        });

        await invalidateCache({ product: true, admin: true });

        res.status(200).json({
            success: true,
            message: `${product.name} inserted into the database.`,
            product,
        });
    }
);

//Revalidate on adding new product ,updation and deletion of any product...
export const getLatestProducts = TryCatch(
    async (req, res, next) => {
        console.log("in the latest product page")
        let products;
        if (mynodecache.has("latestproducts")) {
            products = JSON.parse(mynodecache.get("latestproducts") as string)
        }

        //mynodecache is used to store the data in cache memory to fetch the data fastly or to reduce the latency... 
        else {
            products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
            mynodecache.set("latestproducts", JSON.stringify(products))
        }
        res.status(200).json({
            success: true,
            data: products,
            message: `latest Products fetched succesfully....`
        })
    }
)

export const getCategories = TryCatch(
    async (req, res, next) => {
        let categories
        if (mynodecache.has("categories")) {
            categories = JSON.parse(mynodecache.get("categories") as string)
        }
        else {
            categories = await Product.distinct("category");
            mynodecache.set("categories", JSON.stringify(categories));
        }

        res.status(200).json({
            success: true,
            data: categories,
            message: `Categories fetched succesfully....`
        })
    }
)

export const getAdminProducts = TryCatch(
    async (req, res, next) => {
        console.log("in the admin products")
        let adminproducts;
        if (mynodecache.has("products")) {
            adminproducts = JSON.parse(mynodecache.get("adminproducts") as string);
        }
        else {
            adminproducts = await Product.find({});
            mynodecache.set("adminproducts", JSON.stringify(adminproducts));
        }

        res.status(200).json({
            success: true,
            data: adminproducts,
            message: `Categories fetched succesfully....`
        })
    }
)

export const getSingleProduct = TryCatch(
    async (req, res, next) => {

        let product;
        if (mynodecache.has(`product-${req.params.id}`)) {
            product = JSON.parse(mynodecache.get(`product-${req.params.id}`) as string);
        }
        else {
            product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(401).json({
                    success: false,
                    message: "Product does not exist..."
                })
            }
            mynodecache.set(`product-${req.params.id}`, JSON.stringify(product));
        }

        res.status(200).json({
            success: true,
            data: product,
            message: `Product fetched succesfully....`
        })
    }
)

export const updateProduct = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;
        const { name, price, stock, category } = req.body;
        const photo = req.file;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product does not exist...`
            })
        }

        if (photo) {
            rm(product.photo!, () => {
                console.log("Old photo deleted successfully...")
            })
            product.photo = photo.path;
            return next(new ErrorHandler("Please add all fields first..", 400))
        }
        if (name) product.name = name;
        if (price) product.price = price;
        if (stock) product.stock = stock;
        if (category) product.category = category

        await product.save();
        await invalidateCache({
            product: true,
            productId: String(product._id),
            admin: true,
        });

        res.status(200).json({
            success: true,
            message: `Product Updated successfully...`
        })
    }
)

export const deleteProduct = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product does not exist...`
            })
        }
        rm(product.photo!, () => {
            console.log("Photo deleted successfully...")
        })
        await product.deleteOne();
        await invalidateCache({
            product: true,
            productId: String(product._id),
            admin: true,
        });
        res.status(200).json({
            success: true,
            message: `Product Deleted successfully...`
        })
    }
)

export const getAllProducts = TryCatch(
    async (req: Request<{}, {}, SearchRequestQuery>, res, next) => {
        console.log("Inside get all products...")
        const { search, sort, category, price } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
        const skip = (page - 1) * limit;
        const baseQuery: BaseQuery = {};
        if (search) {
            baseQuery.name = {
                $regex: String(search),
                $options: "i"
            }
        }
        if (price) {
            baseQuery.price = {
                $lte: Number(price)
            }
        }
        if (category) {
            baseQuery.category = String(category).toLowerCase();
        }
        const productsPromise = Product.find(baseQuery).sort(sort && { price: sort === "asc" ? 1 : -1 }).limit(limit).skip(skip);

        const [products, filteredOnlyProducts] = await Promise.all([
            productsPromise,
            Product.find(baseQuery)
        ])
        const totalpage = Math.ceil(filteredOnlyProducts.length / limit);
        return res.status(200).json({
            success: true,
            data: products,
            totalPages: totalpage,
        })
    }
)

async function uploadImages(imageFiles: Express.Multer.File[]) {
    const uploadPromises = imageFiles.map(async (image) => {
        const res = await cloudinary.v2.uploader.upload(image.path, {
            folder: "products", // Specify a folder in Cloudinary for organized storage
            use_filename: true,
            unique_filename: false,
        });
        return res.secure_url; // Return the secure URL from Cloudinary
    });

    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
}