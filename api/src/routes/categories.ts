import { Router } from "express";
import { getCategories } from "../controllers/categories";

export const categories = Router();

categories.get("/", getCategories);
