import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";

/**
 * 📦 Lấy danh sách danh mục (categories)
 *  - Dò toàn bộ key ecom:cat:*:products
 *  - Trả về mảng [{ id, name, productCount }]
 */
export const getCategories = CatchAsync(async (req, res) => {
  // ⚠️ Lưu ý: KEYS không tối ưu trên Redis lớn
  // => Nếu hệ thống có nhiều dữ liệu, dùng SCAN thay cho KEYS
  const keys = await redis.keys("ecom:cat:*:products");

  const categories = await Promise.all(
    keys.map(async (k) => {
      const parts = k.split(":"); // ["ecom","cat","tee","products"]
      const catId = parts[2];
      const productCount = await redis.scard(k); // Đếm sản phẩm trong danh mục
      return {
        id: catId,
        name: mapCategory(catId),
        key: k,
        productCount,
      };
    })
  );

  res.json({ ok: true, total: categories.length, categories });
});

/** 🏷️ Map ID sang tên tiếng Việt hiển thị */
function mapCategory(catId: string) {
  const dict: Record<string, string> = {
    tee: "Áo thun",
    shirt: "Áo sơ mi",
    jean: "Quần jean",
    hoodie: "Hoodie",
    jacket: "Áo khoác",
    sweater: "Áo len",
    trousers: "Quần tây",
    sneakers: "Giày sneakers",
  };
  // Chuẩn hoá chữ thường + fallback chính nó nếu chưa map
  const norm = catId?.toLowerCase();
  return dict[norm] || norm || "Khác";
}
