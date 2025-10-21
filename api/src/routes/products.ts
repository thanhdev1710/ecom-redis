import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/products";

export const products = Router();

products.route("/").get(getProducts).post(createProduct);

products
  .route("/:id")
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);
