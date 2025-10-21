import items from "../data/data.json";
import { normalize } from "../utils/normalize";

export type QuickReply = { text: string; payload?: string; url?: string };

export type BotResponse =
  | { type: "text"; text: string; quickReplies?: QuickReply[] }
  | { type: "product"; product: any; quickReplies?: QuickReply[] }
  | { type: "link"; text: string; url: string; quickReplies?: QuickReply[] };

export function getProductReply(product: any): BotResponse {
  return {
    type: "product",
    product: product,
    quickReplies: [
      { text: "Xem thêm sản phẩm tương tự", payload: "similar" },
      { text: "Báo giá bộ sản phẩm", url: "/quote.html" }
    ]
  };
}

export function getSimilarProductsReply(currentProduct: any): BotResponse {
  const products = require("../data/data.json");
  const currentCategory = (currentProduct.brand || currentProduct.categoryId || "").toLowerCase();
  
  // Lọc sản phẩm cùng hãng hoặc loại, loại trừ sản phẩm hiện tại
  const similarProducts = products.filter((p: any) => 
    p.id !== currentProduct.id && 
    ((p.brand || "").toLowerCase().includes(currentCategory) || 
     (p.categoryId || "").toLowerCase().includes(currentCategory))
  ).slice(0, 3);
  
  if (similarProducts.length === 0) {
    return {
      type: "text",
      text: "Hiện tại chưa có sản phẩm tương tự. Bạn có thể xem các sản phẩm khác:",
      quickReplies: [
        { text: "Báo giá bộ sản phẩm", url: "/quote.html" },
        { text: "Tư vấn kỹ thuật", payload: "tư vấn" }
      ]
    };
  }
  
  const productList = similarProducts.map((p: any) => 
    `• ${p.name} ${p.brand ? `(${p.brand})` : ''} - ${p.price?.toLocaleString("vi-VN")}đ`
  ).join('\n');
  
  return {
    type: "text",
    text: `Các sản phẩm tương tự:\n\n${productList}\n\nBạn muốn xem sản phẩm nào?`,
    // Kèm danh sách item để widget render card
    // Lưu ý: giữ shape tương thích data.json
    items: similarProducts,
    quickReplies: similarProducts.map((p: any) => ({
      text: `Xem ${p.name}`,
      payload: `thông tin ${p.name.toLowerCase()}`
    }))
  } as any;
}

export function getBulkQuoteReply(): BotResponse {
  return {
    type: "link",
    text: "Bạn vui lòng điền thông tin vào form dưới đây để nhận báo giá tổng hợp.",
    url: "/quote.html",
    quickReplies: baseQuickReplies()
  };
}

export function getConsultingReply(): BotResponse {
  return {
    type: "text",
    text: "Bạn cần tư vấn về sản phẩm nào?",
    quickReplies: [
      { text: "Tư vấn Áo thun", payload: "tư vấn áo thun" },
      { text: "Tư vấn Quần jean", payload: "tư vấn quần jean" },
      { text: "Tư vấn Hoodie", payload: "tư vấn hoodie" },
      { text: "Tư vấn Áo khoác", payload: "tư vấn áo khoác" },
      { text: "Tư vấn Giày sneakers", payload: "tư vấn giày" }
    ]
  };
}

export function getGreetingReply(): BotResponse {
  const popularProducts = [...(items as any[])]
    .sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 3);
  return {
    type: "text",
    text: "Xin chào! Mình có vài gợi ý dành cho bạn.",
    quickReplies: [
      ...popularProducts.map((p: any) => ({ text: p.name, payload: `thông tin ${p.name.toLowerCase()}` })),
      ...baseQuickReplies()
    ]
  };
}

export function getThanksReply(): BotResponse {
  return {
    type: "text",
    text: "Không có gì! Bạn cần hỗ trợ gì thêm không?",
    quickReplies: baseQuickReplies()
  };
}

export function getGoodbyeReply(): BotResponse {
  return {
    type: "text",
    text: "Tạm biệt! Hẹn gặp lại bạn lần sau. Chúc bạn một ngày tốt lành!",
    quickReplies: []
  };
}

export function getSmartFallbackReply(): BotResponse {
  const popularProducts = [...(items as any[])]
    .sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 3);
  return {
    type: "text",
    text: "Mình chưa hiểu ý bạn. Bạn có thể xem một số sản phẩm gợi ý bên dưới.",
    items: popularProducts,
    quickReplies: [
      { text: "Gợi ý theo ngân sách", payload: "gợi ý rẻ" },
      { text: "Gợi ý Áo thun", payload: "gợi ý áo thun" },
      { text: "Tư vấn chọn size", payload: "size" }
    ]
  } as any;
}

export function getBestSellersReply(count = 3): BotResponse {
  const products = [...(items as any[])]
    .sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0))
    .slice(0, Math.max(1, count));
  if (count === 1) {
    const top = products[0];
    return getProductReply(top);
  }
  const lines = products.map((p: any) => `• ${p.name} - Đã bán ${p.sold || 0}` ).join("\n");
  return {
    type: "text",
    text: `Top bán chạy:\n\n${lines}`,
    items: products,
    quickReplies: products.map((p: any) => ({ text: `Xem ${p.name}`, payload: `thông tin ${p.name.toLowerCase()}` }))
  } as any;
}

export function getRecommendReply(message: string): BotResponse {
  const text = (message || "").toLowerCase();
  const products = items as any[];

  // 1) Parse budget (e.g., 200k, 300.000đ, 1tr2, 1.2m, 1,200,000)
  const budget = parseBudget(text); // number VND or null

  // 2) Parse category
  const cat = parseCategory(text); // tee/jean/...

  // 3) Determine preference
  const isCheap = text.includes("rẻ") || text.includes("tiết kiệm") || text.includes("budget");
  const isPremium = text.includes("cao cấp") || text.includes("đẹp") || text.includes("xịn") || text.includes("premium");

  let pool = products;
  if (cat) pool = pool.filter((p: any) => (p.categoryId || "") === cat);
  if (typeof budget === 'number') pool = pool.filter((p: any) => typeof p.price === 'number' && p.price <= budget);

  if (isPremium) pool = [...pool].sort((a: any, b: any) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.sold || 0) - (a.sold || 0));
  else if (isCheap && !budget) pool = [...pool].sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
  else pool = [...pool].sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0));

  // Backfill if pool empty due to hard filters
  if (pool.length === 0) {
    pool = products;
    if (cat) pool = pool.filter((p: any) => (p.categoryId || "") === cat);
    pool = [...pool].sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0));
  }

  const picks = pool.slice(0, 3);
  const budgetText = typeof budget === 'number' ? ` (≤ ${budget.toLocaleString('vi-VN')}đ)` : '';
  const head = cat ? `Mình đề xuất ${labelFromCategory(cat)}${budgetText}:` : `Mình đề xuất cho bạn${budgetText}:`;

  return {
    type: "text",
    text: head,
    items: picks,
    quickReplies: refinedQuickReplies(cat, budget)
  } as any;
}

function parseBudget(text: string): number | null {
  // Match patterns: 200k, 300.000đ, 1tr2, 1.2m, 1,200,000
  const m1 = text.match(/(\d{1,3}(?:[\.,]\d{3})+|\d+)(?:\s*đ|\s*vnd)?/i); // 300.000đ, 1,200,000
  const m2 = text.match(/(\d+(?:[\.,]\d+)?)(\s*)(k|nghìn|ngan|ngàn|tr|triệu|m)\b/i); // 200k, 1.2m, 1tr2
  if (m2) {
    const num = Number(m2[1].replace(',', '.'));
    const unit = m2[3].toLowerCase();
    if (!isFinite(num)) return null;
    if (unit === 'k' || unit.startsWith('ng')) return Math.round(num * 1_000);
    if (unit === 'm' || unit.startsWith('tr')) return Math.round(num * 1_000_000);
  }
  if (m1) {
    const raw = m1[1].replace(/[\.,]/g, '');
    const n = Number(raw);
    return isFinite(n) ? n : null;
  }
  // Heuristic defaults
  if (text.includes('rẻ') || text.includes('budget')) return 250_000;
  return null;
}

function parseCategory(text: string): string | null {
  const map: Record<string, string> = {
    'áo thun': 'tee', 'tee': 'tee', 'hoodie': 'hoodie', 'áo khoác': 'jacket', 'jacket': 'jacket',
    'áo sơ mi': 'shirt', 'sweater': 'sweater', 'giày': 'sneakers', 'sneakers': 'sneakers',
    'quần jean': 'jean', 'jean': 'jean', 'quần tây': 'trousers'
  };
  for (const k in map) if (text.includes(k)) return map[k];
  return null;
}

function labelFromCategory(cat: string): string {
  const r: Record<string, string> = { tee: 'Áo thun', hoodie: 'Hoodie', jacket: 'Áo khoác', shirt: 'Áo sơ mi', sweater: 'Sweater', sneakers: 'Giày', jean: 'Quần jean', trousers: 'Quần tây' };
  return r[cat] || 'sản phẩm';
}

function refinedQuickReplies(cat: string | null, budget: number | null): QuickReply[] {
  const base: QuickReply[] = [];
  if (!cat) base.push({ text: 'Gợi ý Áo thun', payload: 'gợi ý áo thun' }, { text: 'Gợi ý Quần jean', payload: 'gợi ý quần jean' });
  if (!budget) base.push({ text: '≤ 200k', payload: 'gợi ý 200k' }, { text: '≤ 300k', payload: 'gợi ý 300k' }, { text: '≤ 500k', payload: 'gợi ý 500k' });
  base.push({ text: 'Ưu tiên rẻ', payload: 'gợi ý rẻ' }, { text: 'Ưu tiên cao cấp', payload: 'gợi ý cao cấp' }, { text: 'Tư vấn size', payload: 'size' });
  return base;
}

export function getProductInfoReply(product: any): BotResponse {
  const price = typeof product.price === "number" ? product.price.toLocaleString("vi-VN") + "đ" : "";
  const brand = product.brand ? `Thương hiệu: ${product.brand}` : "";
  const rating = product.ratingAvg ? `Đánh giá: ${product.ratingAvg}⭐` : "";
  const sold = product.sold ? `Đã bán: ${product.sold}` : "";
  const lines = [product.name, brand, rating, sold, price].filter(Boolean).join("\n");
  return { type: "text", text: lines, quickReplies: baseQuickReplies() };
}

export function getStockInfoReply(product: any): BotResponse {
  const stockText = typeof product.stock === "number" ? `Tồn kho: ${product.stock} sản phẩm` : "Chưa rõ tồn kho";
  return { type: "text", text: `${product.name}\n${stockText}`, quickReplies: baseQuickReplies() };
}

export function getSizeInfoReply(product: any): BotResponse {
  const cat = (product.categoryId || "").toLowerCase();
  let guide = "S, M, L, XL";
  if (cat.includes("jean") || cat.includes("trousers")) guide = "28, 29, 30, 31, 32, 33, 34";
  if (cat.includes("sneakers")) guide = "39, 40, 41, 42, 43";
  const tips = cat.includes('jean')
    ? "Gợi ý nhanh: 60-65kg ~ size 29-30, 66-72kg ~ size 31-32 (tham khảo)."
    : cat.includes('tee') || cat.includes('hoodie') || cat.includes('sweater')
      ? "Gợi ý nhanh: 1m65-1m72, 60-70kg ~ size L; 70-80kg ~ size XL (tham khảo)."
      : "Kích cỡ tham khảo tuỳ phom dáng sản phẩm.";
  return { type: "text", text: `${product.name}\nSize gợi ý: ${guide}\n${tips}`, quickReplies: baseQuickReplies() };
}

export function getMissingEntityReply(intent: string): BotResponse {
  switch (intent) {
    case "quote_single":
      return {
        type: "text",
        text: "Bạn đang tìm sản phẩm cụ thể nào ạ? Ví dụ: Áo thun basic trắng, Quần jean slim fit...",
        quickReplies: [
          { text: "Xem Áo thun basic trắng", payload: "thông tin áo thun basic trắng" },
          { text: "Xem Hoodie nỉ trơn xám", payload: "thông tin hoodie nỉ trơn xám" },
          { text: "Gợi ý theo ngân sách", payload: "gợi ý rẻ" }
        ]
      };
    case "consulting":
      return {
        type: "text",
        text: "Bạn cần tư vấn về loại sản phẩm nào ạ?",
        quickReplies: [
          { text: "Tư vấn Áo thun", payload: "tư vấn áo thun" },
          { text: "Tư vấn Quần jean", payload: "tư vấn quần jean" },
          { text: "Tư vấn Hoodie", payload: "tư vấn hoodie" }
        ]
      };
    default:
      return getSmartFallbackReply();
  }
}

function baseQuickReplies(): QuickReply[] {
  return [
    { text: "Gợi ý theo ngân sách", payload: "gợi ý rẻ" },
    { text: "Gợi ý theo danh mục", payload: "gợi ý áo thun" },
    { text: "Tư vấn chọn size", payload: "size" }
  ];
}

export function getCategoryListReply(): BotResponse {
  // Lấy các category từ data.json
  const products = items as any[];
  const categories = new Map<string, number>();
  products.forEach(p => {
    const cat = p.categoryId || "khác";
    categories.set(cat, (categories.get(cat) || 0) + 1);
  });
  const prettyCat = Array.from(categories.entries()).map(([cat, count]) => {
    const label = cat.replace(/^c:/, "");
    return `• ${label} (${count} sp)`;
  }).join("\n");
  return {
    type: "text",
    text: `Các danh mục hiện có:\n\n${prettyCat}\n\nBạn muốn xem danh mục nào?`,
    quickReplies: [
      { text: "Xem Áo thun", payload: "thông tin áo thun" },
      { text: "Xem Quần jean", payload: "thông tin quần jean" },
      { text: "Xem Hoodie", payload: "thông tin hoodie" }
    ]
  };
}


