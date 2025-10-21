import items from "../data/data.json";
import rules from "../data/rules.json";
import { normalize } from "../utils/normalize";

type Product = {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  price?: number;
  categoryId?: string;
};

type ChatReply = {
  productId?: string;
  name?: string;
  brand?: string;
  image?: string;
  price?: number;
  matches: string[];
  type: "single" | "multiple" | "none" | "bulk_quote" | "order_info";
  textFallback?: string;
  url?: string;
};

const activationKeywords = [
  "báo giá",
  "giá",
  "thông tin",
  "tư vấn",
  "report price",
  "price",
  "đơn hàng",
  "order",
  "tình trạng đơn"
];

const bulkQuoteKeywords = [
  "nhiều sản phẩm",
  "bộ sản phẩm",
  "bộ thiết bị",
  "tổng hợp",
  "danh mục",
  "form báo giá",
  "báo giá tổng hợp",
  "mua nhiều loại thiết bị"
];

function containsActivation(normal: string) {
  return activationKeywords.some(k => normal.includes(k));
}

function keywordMatch(normal: string, p: Product) {
  const fields = [p.name, p.brand || "", p.categoryId || ""];
  return fields.some(k => {
    const kn = normalize(k);
    return normal.includes(kn) || kn.includes(normal);
  });
}

export type Intent =
  | "quote_single"
  | "quote_bulk"
  | "consulting"
  | "greeting"
  | "product_info"
  | "size_info"
  | "stock_info"
  | "list_categories"
  | "recommend"
  | "none";

export function detectIntent(message: string): Intent {
  const normal = normalize(message);
  // Prioritize category listing when both 'hỗ trợ' and 'danh mục' appear
  if (["danh mục", "xem danh mục", "loại sản phẩm", "categories", "category"].some(k => normal.includes(normalize(k)))) {
    return "list_categories";
  }
  const entries = Object.entries(rules) as Array<[Intent, string[]]>;
  for (const [intent, kws] of entries) {
    if ((kws || []).some(k => keywordBoundaryMatch(normal, k))) return intent;
  }
  if ((rules as any).recommend && (rules as any).recommend.some((k: string) => keywordBoundaryMatch(normal, k))) return "recommend";
  return "none";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordBoundaryMatch(normalMessage: string, keyword: string): boolean {
  const kn = normalize(keyword);
  if (!kn) return false;
  const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(kn)}(?:\\s|$)`);
  return pattern.test(normalMessage);
}

export function findReplyForMessage(message: string): ChatReply {
  const normal = normalize(message);

  const intent = detectIntent(message);
  if (intent === "quote_bulk") {
    return {
      type: "bulk_quote",
      matches: [],
      url: "/quote.html",
      textFallback:
        "Bạn vui lòng điền thông tin và chọn sản phẩm cần báo giá tại form dưới đây. Sau khi gửi, hệ thống sẽ tạo file PDF báo giá để bạn tải về."
    };
  }
  // order_info was removed from supported intents

  const activated = containsActivation(normal);
  const products = items as unknown as Product[];
  const hits = products.filter(p => keywordMatch(normal, p));

  if (!activated && hits.length === 0) {
    return {
      type: "none",
      matches: [],
      textFallback:
        "Xin chào. Bạn có thể hỏi báo giá hoặc tên sản phẩm, ví dụ: 'báo giá Áo thun basic trắng'."
    };
  }

  if (hits.length === 0) {
    return {
      type: "none",
      matches: [],
      textFallback:
        "Không tìm thấy sản phẩm phù hợp. Vui lòng thử từ khoá khác hoặc xem danh mục sản phẩm."
    };
  }

  if (hits.length === 1) {
    const p = hits[0];
    return {
      type: "single",
      productId: p.id,
      name: p.name,
      brand: p.brand,
      image: p.image,
      price: p.price,
      matches: [p.name, p.brand || ""].filter(Boolean)
    };
  }

  // multiple hits
  return {
    type: "multiple",
    matches: hits.map(h => h.id),
    textFallback:
      "Mình tìm thấy nhiều sản phẩm phù hợp. Bạn vui lòng mô tả rõ hơn tên sản phẩm hoặc thương hiệu."
  };
}


