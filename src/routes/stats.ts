import express, { Request, Response, NextFunction } from "express";
import { adminOnly } from "../middlewares/auth.js";
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from "../controller/stats.js";

const app = express.Router();

app.get("/dashboardstats",adminOnly,getDashboardStats);

app.get("/pie",adminOnly,getPieCharts);

app.get("/bar",adminOnly,getBarCharts);

app.get("/line",adminOnly,getLineCharts)


export default app;
