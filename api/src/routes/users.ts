import express from "express";
import {
  registerUser,
  loginUser,
  getUserById,
  deleteUser,
  getUserOrders,
  requireRole,
  updateUser,
  changePassword,
} from "../controllers/users";

export const users = express.Router();

// /api/users
users.post("/register", registerUser);
users.post("/login", loginUser);
users.get("/:uid", getUserById);
users.delete("/:uid", deleteUser);
users.get("/:uid/orders", getUserOrders);
users.patch("/:uid", updateUser);
users.post("/:uid/change-password", changePassword);
