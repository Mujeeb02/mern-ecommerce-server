import mongoose, { Document } from "mongoose";
import { InvalidateCacheProps, OrderItemsType } from "../types/type.js";
import { Product } from "../models/product.js";
import { mynodecache } from "../app.js";
export const connectDB = (uri: string) => {
    console.log(uri)
    mongoose
      .connect(uri, {
        dbName: "Ecommerce_24",
      })
      .then((c) => console.log(`DB Connected to ${c.connection.host}`))
      .catch((e) => console.log(e));
  };

export const invalidateCache = async ({ product, order, admin, userId, orderId, productId }: InvalidateCacheProps) => {
    if (product) {
        const productKeys: string[] = [
            "latestproducts", "categories", "products"
        ]
        if (typeof productId === "string") productKeys.push(`product-${productId}`);

        if (Array.isArray(productId))
            productId.forEach((i: any) => productKeys.push(`product-${i}`));
        mynodecache.del(productKeys)
    }

    if (order) {
        const ordersKeys: string[] = [
            "all-orders",
            `my-orders-${userId}`,
            `order-${orderId}`,
        ];
        mynodecache.del(ordersKeys);
    }
    if (admin) {
        mynodecache.del([
            "admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts",
        ]);
    }
}

export const reduceStock = async (orderItems: OrderItemsType[]) => {
    // console.log("Im in reduce stock")
    for (let index = 0; index < orderItems.length; index++) {
        const order = orderItems[index];
        const product = await Product.findById(order.productId);
        console.log(order.productId)
        if (!product) {
            throw new Error("Product not found...")
        }
        // console.log(order.quantity)
        product.stock -= order.quantity;
        // console.log(product.stock)
        await product.save();
    }
}

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
    if (lastMonth === 0) return thisMonth * 100;
    const percent = (thisMonth / lastMonth) * 100;
    return Number(percent.toFixed(0));
};

export const getInventories = async ({
    categories,
    productCount,
}: {
    categories: string[];
    productCount: number;
}) => {
    const categoriesCountPromise = categories.map((category) =>
        Product.countDocuments({ category })
    );

    const categoriesCount = await Promise.all(categoriesCountPromise);

    const categoryCount: Record<string, number>[] = [];

    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productCount) * 100),
        });
    });

    return categoryCount;
};

interface MyDocument extends Document {
    createdAt?: Date;
    discount?: number;
    total?: number;
  }
  type FuncProps = {
    length: number;
    docArr: MyDocument[];
    today: Date;
    property?: "discount" | "total";
  };
  
  export const getChartData = ({
    length,
    docArr,
    today,
    property,
  }: FuncProps) => {
    const data: number[] = new Array(length).fill(0);
  
    docArr.forEach((i) => {
      const creationDate = i.createdAt!;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
      if (monthDiff < length) {
        if (property) {
          data[length - monthDiff - 1] += i[property]!;
        } else {
          data[length - monthDiff - 1] += 1;
        }
      }
    });
  
    return data;
  };