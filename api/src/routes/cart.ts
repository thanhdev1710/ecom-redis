import { Router } from "express";
import {
  getCartByUserId,
  addCartByUserId,
  removeCartItemByUserId,
  clearCartByUserId,
} from "../controllers/cart"; // Giả sử các hàm controller nằm trong ../controllers/cart

export const cart = Router();

// Định tuyến chính cho Giỏ hàng: Lấy, Thêm/Cập nhật, và Xóa toàn bộ
cart
  .route("/:uid")
  // GET /api/cart/:uid : Lấy toàn bộ nội dung giỏ hàng
  .get(getCartByUserId)
  // POST /api/cart/:uid : Thêm sản phẩm mới hoặc Tăng số lượng sản phẩm đã có
  .post(addCartByUserId)
  // DELETE /api/cart/:uid : Xóa toàn bộ Hash key (Xóa hết giỏ hàng)
  .delete(clearCartByUserId);

// Định tuyến cho việc xóa một item cụ thể
// DELETE /api/cart/:uid/item : Xóa một sản phẩm dựa trên 'pid' trong body
cart.delete("/:uid/item", removeCartItemByUserId);
