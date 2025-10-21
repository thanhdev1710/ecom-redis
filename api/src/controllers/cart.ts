import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";
import { Request, Response } from "express";

interface CartItem {
  pid: string;
  qty: number;
}

const normalizeEmail = (email: string) =>
  String(email || "")
    .trim()
    .toLowerCase();

/* ================================
 * 1) LẤY GIỎ HÀNG THEO USER (email)
 * ================================ */
export const getCartByUserId = CatchAsync(
  async (req: Request, res: Response) => {
    const uid = normalizeEmail(req.params.uid);
    const key = `ecom:cart:${uid}`;

    // ioredis.hgetall trả về object { field: value }
    const hash = await redis.hgetall(key);

    const items: CartItem[] = Object.entries(hash)
      .map(([pid, qtyStr]) => ({
        pid,
        qty: parseInt(qtyStr as string, 10) || 0,
      }))
      .filter((it) => it.qty > 0);

    return res.json({ ok: true, uid, items });
  }
);

/* ==========================================
 * 2) THÊM/CẬP NHẬT SỐ LƯỢNG SẢN PHẨM TRONG CART
 *    - qty > 0: tăng
 *    - qty < 0: giảm
 *    - nếu kết quả <= 0 ⇒ tự xoá field
 * ========================================== */
export const addCartByUserId = CatchAsync(
  async (req: Request, res: Response) => {
    const uid = normalizeEmail(req.params.uid);
    const key = `ecom:cart:${uid}`;
    const { pid, qty = 1, step } = req.body || {};

    if (!pid || typeof pid !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid Product ID (pid)." });
    }

    let inc = Number(qty);
    if (!Number.isFinite(inc) || inc === 0) {
      return res.status(400).json({
        ok: false,
        error: "Quantity (qty) must be a non-zero number.",
      });
    }

    // ✅ Nếu là thao tác bấm nút +/- (step mode) → luôn tăng/giảm đúng 1
    // - step === true: clamp về +1 hoặc -1 theo dấu qty
    // - step !== true: giữ nguyên hành vi cũ (thêm nhiều được)
    if (step === true) {
      inc = inc > 0 ? 1 : -1;
    }

    const newQty = await redis.hincrby(key, pid, inc);

    // Nếu <= 0 thì xoá hẳn item khỏi giỏ
    if (newQty <= 0) {
      await redis.hdel(key, pid);
      return res.json({
        ok: true,
        pid,
        newQty: 0,
        removed: true,
        message: "Item removed because quantity <= 0.",
      });
    }

    return res.json({
      ok: true,
      pid,
      newQty,
      removed: false,
      message: "Item quantity updated successfully.",
    });
  }
);

/* ================================
 * 3) XOÁ MỘT SẢN PHẨM KHỎI GIỎ
 * ================================ */
export const removeCartItemByUserId = CatchAsync(
  async (req: Request, res: Response) => {
    const uid = normalizeEmail(req.params.uid);
    const key = `ecom:cart:${uid}`;
    const { pid } = req.body || {};

    if (!pid || typeof pid !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "Product ID (pid) is required." });
    }

    const deletedCount = await redis.hdel(key, pid); // number
    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ ok: false, message: "Item not found in cart." });
    }

    return res.json({ ok: true, message: `Item ${pid} removed from cart.` });
  }
);

/* ================================
 * 4) XOÁ TOÀN BỘ GIỎ HÀNG
 * ================================ */
export const clearCartByUserId = CatchAsync(
  async (req: Request, res: Response) => {
    const uid = normalizeEmail(req.params.uid);
    const key = `ecom:cart:${uid}`;

    const deleted = await redis.del(key); // number
    if (deleted === 0) {
      return res.json({ ok: true, message: "Cart was already empty." });
    }
    return res.json({ ok: true, message: "Cart cleared successfully." });
  }
);
