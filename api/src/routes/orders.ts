import { Router } from "express";
import { getOrdersByUserId, submitOrderByUserId } from "../controllers/orders";

export const orders = Router();

orders.post("/:uid", submitOrderByUserId);
orders.get("/:uid", getOrdersByUserId);
