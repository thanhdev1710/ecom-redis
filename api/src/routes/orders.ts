import { Router } from "express";
import { submitOrderByUserId } from "../controllers/orders";

export const orders = Router();

orders.post("/:uid", submitOrderByUserId);
