import express from "express";
import { requireRole } from "../controllers/users"; // dùng middleware sẵn có
import {
  listUsers,
  updateUserBasic,
  updateUserRole,
  toggleLockUser,
} from "../controllers/admin.users";
import { listOrders, updateOrderStatus } from "../controllers/admin.orders";
import { revenueOverTime, topProducts } from "../controllers/admin.analytics";

export const admin = express.Router();

// Bảo vệ toàn bộ admin routes
// admin.use(requireRole(["admin"]));

// Users
admin.get("/users", listUsers);
admin.patch("/users/:email", updateUserBasic);
admin.patch("/users/:email/role", updateUserRole);
admin.patch("/users/:email/lock", toggleLockUser);

// Orders
admin.get("/orders", listOrders);
admin.patch("/orders/:oid/status", updateOrderStatus);

// Analytics
admin.get("/analytics/revenue", revenueOverTime);
admin.get("/analytics/top-products", topProducts);
