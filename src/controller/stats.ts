import { Request, Response, NextFunction } from "express";
import { mynodecache } from "../app.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { Order } from "../models/order.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let stats;
        if (mynodecache.has("admin-stats")) {
            stats = JSON.parse(mynodecache.get("admin-stats") as string);
        }
        else {
            const today = new Date();
            const sixMonthsago = new Date();
            sixMonthsago.setMonth(sixMonthsago.getMonth() - 6);
            const thisMonth = {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today,
            }
            const lastMonth = {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                end: new Date(today.getFullYear(), today.getMonth(), 0),
            }
            const thisMonthProductsPromise = Product.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end,
                }
            })
            const lastMonthProductsPromise = Product.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })

            const thisMonthUsersPromise = User.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end,
                }
            })
            const lastMonthUsersPromise = User.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })

            const thisMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end,
                }
            })
            const lastMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })

            const lastsixMonthsOrdersPromise = Order.find({
                createdAt: {
                    $gte: sixMonthsago,
                    $lte: today,
                }
            })

            const lastsixMonthsUserPromise = User.find({
                createdAt: {
                    $gte: sixMonthsago,
                    $lte: today,
                }
            })

            const lastsixMonthsProductsPromise = Product.find({
                createdAt: {
                    $gte: sixMonthsago,
                    $lte: today,
                }
            })

            const latestTransactionsPromise = Order.find({}).select(["orderItems", "discount", "total", "status"])

            const [
                thisMonthProducts,
                thisMonthOrders,
                thisMonthUsers,
                lastMonthProducts,
                lastMonthOrders,
                lastMonthUsers,
                productCount,
                userCount,
                allOrders,
                lastsixMonthOrders,
                categories,
                femaleUsersCount,
                latestTransaction,
            ] = await Promise.all([
                thisMonthProductsPromise,
                thisMonthOrdersPromise,
                thisMonthUsersPromise,
                lastMonthProductsPromise,
                lastMonthOrdersPromise,
                lastMonthUsersPromise,
                Product.countDocuments(),
                User.countDocuments(),
                Order.find({}).select("total"),
                lastsixMonthsOrdersPromise,
                Product.distinct("category"),
                User.countDocuments({ gender: "female" }),
                latestTransactionsPromise,
            ])
            console.log(categories)
            const thisMonthRevenue = thisMonthOrders.reduce(
                (total, order) => total + (order.total || 0),
                0
            );

            const lastMonthRevenue = lastMonthOrders.reduce(
                (total, order) => total + (order.total || 0),
                0
            );

            const percentageChange = {
                revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
                product: calculatePercentage(
                    thisMonthProducts.length, lastMonthProducts.length
                ),
                user: calculatePercentage(
                    thisMonthUsers.length, lastMonthUsers.length
                ),
                order: calculatePercentage(
                    thisMonthOrders.length, lastMonthOrders.length
                )
            }
            const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0)

            const count = {
                revenue,
                user: userCount,
                Product: productCount,
                order: allOrders.length,
            }

            const OrderMonthCounts = new Array(6).fill(0);
            const OrderMonthRevenue = new Array(6).fill(0);
            //  console.log(lastsixMonthOrders)
            lastsixMonthOrders.forEach((order) => {
                const creationDate = order.createdAt;
                const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
                if (monthDiff < 6) {
                    OrderMonthCounts[6 - monthDiff - 1] += 1;
                    OrderMonthRevenue[6 - monthDiff - 1] += order.total;
                }
            })

            const categoryCount = await getInventories({
                categories,
                productCount,
            });

            const userRatio = {
                male: userCount - femaleUsersCount,
                female: femaleUsersCount,
            };

            const modifiedLatestTransaction = latestTransaction.map((i) => ({
                _id: i._id,
                discount: i.discount,
                amount: i.total,
                quantity: i.orderItems.length,
                status: i.status,
            }));
            //  console.log(count)

            stats = {
                categoryCount,
                percentageChange,
                count,
                chart: {
                    order: OrderMonthCounts,
                    revenue: OrderMonthRevenue,
                },
                userRatio,
                latestTransaction: modifiedLatestTransaction,
            }
        }
        mynodecache.set("admin-stats", JSON.stringify(stats));
        return res.status(201).json({
            succcess: true,
            stats,

        })
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const getPieCharts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let charts;
        const key = "admin-pie-charts";

        if (mynodecache.has(key)) charts = JSON.parse(mynodecache.get(key) as string);
        else {
            const allOrderPromise = Order.find({}).select([
                "total",
                "discount",
                "subtotal",
                "tax",
                "shippingCharges",
            ]);

            const [
                processingOrder,
                shippedOrder,
                deliveredOrder,
                categories,
                productCount,
                outOfStock,
                allOrders,
                allUsers,
                adminUsers,
                customerUsers,
            ] = await Promise.all([
                Order.countDocuments({ status: "Processing" }),
                Order.countDocuments({ status: "Shipped" }),
                Order.countDocuments({ status: "Delivered" }),
                Product.distinct("category"),
                Product.countDocuments(),
                Product.countDocuments({ stock: 0 }),
                allOrderPromise,
                User.find({}).select(["dob"]),
                User.countDocuments({ role: "admin" }),
                User.countDocuments({ role: "user" }),
            ]);
            const orderFullfillment = {
                processing: processingOrder,
                shipped: shippedOrder,
                delivered: deliveredOrder,
            };

            const productCategories = await getInventories({
                categories,
                productCount,
            });

            const stockAvailablity = {
                inStock: productCount - outOfStock,
                outOfStock,
            };

            const grossIncome = allOrders.reduce(
                (prev, order) => prev + (order.total || 0),
                0
            );

            const discount = allOrders.reduce(
                (prev, order) => prev + (order.discount || 0),
                0
            );

            const productionCost = allOrders.reduce(
                (prev, order) => prev + (order.shippingCharges || 0),
                0
            );

            const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

            const marketingCost = Math.round(grossIncome * (30 / 100));

            const netMargin =
                grossIncome - discount - productionCost - burnt - marketingCost;

            const revenueDistribution = {
                netMargin,
                discount,
                productionCost,
                burnt,
                marketingCost,
            };
            console.log(allUsers)
            const usersAgeGroup = {
                teen: allUsers.filter((i) => i.age < 20).length,
                adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
                old: allUsers.filter((i) => i.age >= 40).length,
            };

            const adminCustomer = {
                admin: adminUsers,
                customer: customerUsers,
            };

            charts = {
                orderFullfillment,
                productCategories,
                stockAvailablity,
                revenueDistribution,
                usersAgeGroup,
                adminCustomer,
            };

            mynodecache.set(key, JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts,
        });
    } catch (error) {
        console.error("Error in getPieCharts:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const getBarCharts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let charts;
        const key = "admin-bar-charts";

        if (mynodecache.has(key)) charts = JSON.parse(mynodecache.get(key) as string);
        else {
            const today = new Date();

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const sixMonthProductPromise = Product.find({
                createdAt: {
                    $gte: sixMonthsAgo,
                    $lte: today,
                },
            }).select("createdAt");

            const sixMonthUsersPromise = User.find({
                createdAt: {
                    $gte: sixMonthsAgo,
                    $lte: today,
                },
            }).select("createdAt");

            const twelveMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: twelveMonthsAgo,
                    $lte: today,
                },
            }).select("createdAt");

            const [products, users, orders] = await Promise.all([
                sixMonthProductPromise,
                sixMonthUsersPromise,
                twelveMonthOrdersPromise,
            ]);
            console.log(products);
            const productCounts = getChartData({ length: 6, today, docArr: products });
            const usersCounts = getChartData({ length: 6, today, docArr: users });
            const ordersCounts = getChartData({ length: 12, today, docArr: orders });

            charts = {
                users: usersCounts,
                products: productCounts,
                orders: ordersCounts,
            };

            mynodecache.set(key, JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts,
        })
    } catch (error) {
        console.error("Error in getBarCharts:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const getLineCharts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let charts;
        const key = "admin-line-charts";

        if (mynodecache.has(key)) charts = JSON.parse(mynodecache.get(key) as string);
        else {
            const today = new Date();

            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const baseQuery = {
                createdAt: {
                    $gte: twelveMonthsAgo,
                    $lte: today,
                },
            }

            const [products, users, orders] = await Promise.all([
                Product.find(baseQuery).select("createdAt"),
                User.find(baseQuery).select("createdAt"),
                Order.find(baseQuery).select(["createdAt","discount","total"]),
            ]);
            console.log(products);
            const productCounts = getChartData({ length: 12, today, docArr: products });
            const usersCounts = getChartData({ length: 12, today, docArr: users });
            const discount = getChartData({
                length: 12,
                today,
                docArr: orders,
                property: "discount",
              });
              const revenue = getChartData({
                length: 12,
                today,
                docArr: orders,
                property: "total",
              });
          
              charts = {
                users: usersCounts,
                products: productCounts,
                discount,
                revenue,
              };

            mynodecache.set(key, JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts,
        })
    } catch (error) {
        console.error("Error in getLineCharts:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}