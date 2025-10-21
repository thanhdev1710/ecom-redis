import { detectIntent } from "./matcher";
import { getProductReply, getBulkQuoteReply, getConsultingReply, getGreetingReply, getThanksReply, getGoodbyeReply, getSmartFallbackReply, getMissingEntityReply, getSimilarProductsReply, BotResponse, getStockInfoReply, getSizeInfoReply, getCategoryListReply, getRecommendReply, getBestSellersReply } from "./responder";
import { findFaqAnswer } from "./faqMatcher";
import { detectChitchat } from "./chitchatHandler";
import { extractProduct, extractOrderId } from "./entityExtractor";
import { detectSensitiveWord } from "./sensitiveFilter";
import { getContextForUser, saveContext, clearContext, generateUserId } from "./contextManager";
import { advancedNormalize } from "../utils/normalize";
import items from "../data/data.json";

// Lưu trữ sản phẩm hiện tại để xử lý "similar"
const currentProductStore = new Map<string, any>();

// Tự động tạo danh sách từ khóa sản phẩm từ products.json
function generateSpecificProductKeywords(): string[] {
  const keywords = new Set<string>();
  
  (items as any[]).forEach(product => {
    if (product.name) {
      const words = advancedNormalize(product.name).split(' ');
      words.forEach((w: string) => { if (w.length > 2) keywords.add(w); });
    }
    if (product.brand) {
      const words = advancedNormalize(product.brand).split(' ');
      words.forEach((w: string) => { if (w.length > 2) keywords.add(w); });
    }
  });
  
  return Array.from(keywords);
}

function mapCategoryFromText(normalizedMessage: string): string | null {
  const m = normalizedMessage;
  if (m.includes('áo thun')) return 'c:tee';
  if (m.includes('tee')) return 'c:tee';
  if (m.includes('quần jean') || m.includes('jean')) return 'c:jean';
  if (m.includes('hoodie')) return 'c:hoodie';
  if (m.includes('áo khoác') || m.includes('jacket')) return 'c:jacket';
  if (m.includes('áo sơ mi') || m.includes('shirt')) return 'c:shirt';
  if (m.includes('sweater')) return 'c:sweater';
  if (m.includes('giày') || m.includes('sneakers')) return 'c:sneakers';
  if (m.includes('quần tây') || m.includes('trousers') || m.includes('kaki')) return 'c:trousers';
  return null;
}

// Kiểm tra xem tin nhắn có chứa tên sản phẩm cụ thể hay không
function hasSpecificProductName(normalizedMessage: string): boolean {
  // Kiểm tra có model cụ thể không (ưu tiên cao nhất)
  if (hasSpecificModel(normalizedMessage)) {
    return true;
  }
  
  // Kiểm tra có từ khóa sản phẩm cụ thể không
  const specificProductKeywords = generateSpecificProductKeywords();
  
  // Loại trừ các từ chung chung không phải tên sản phẩm
  const excludeWords = ['giá', 'báo', 'thông', 'tin', 'sản', 'phẩm', 'máy', 'thiết', 'bị', 'xem', 'muốn'];
  
  // Chỉ kiểm tra các từ khóa không nằm trong danh sách loại trừ
  const filteredKeywords = specificProductKeywords.filter(keyword => 
    !excludeWords.includes(keyword)
  );
  
  // Kiểm tra xem có từ khóa nào trong tin nhắn không
  const hasKeyword = filteredKeywords.some(keyword => 
    normalizedMessage.includes(keyword)
  );
  
  // Nếu chỉ có từ "zenit" mà không có model cụ thể thì không coi là có tên sản phẩm
  if (normalizedMessage.includes('zenit') && !hasSpecificModel(normalizedMessage)) {
    return false;
  }
  
  return hasKeyword;
}

// Kiểm tra xem có model cụ thể không
function hasSpecificModel(_normalizedMessage: string): boolean { return false; }

// Kiểm tra xem intent mới có liên quan đến context hiện tại không
function isIntentRelatedToContext(newIntent: string, contextIntent: string): boolean {
  const relatedIntents = {
    'quote_single': ['quote_bulk', 'consulting'],
    'consulting': ['quote_single', 'quote_bulk'],
    'quote_bulk': ['quote_single', 'consulting'],
    'list_categories': ['product_info', 'size_info', 'stock_info']
  };
  
  return relatedIntents[contextIntent as keyof typeof relatedIntents]?.includes(newIntent) || false;
}

export async function handleMessage(message: string, userId?: string): Promise<BotResponse> {
  const actualUserId = userId || generateUserId();
  const normalizedMessage = advancedNormalize(message);
  
  // Lớp 0: Lọc ngôn từ nhạy cảm/thô tục
  const bad = detectSensitiveWord(normalizedMessage);
  if (bad) {
    clearContext(actualUserId);
    return { 
      type: "text", 
      text: "Mình muốn giữ cuộc trò chuyện lịch sự. Bạn vui lòng diễn đạt lại giúp mình nhé." 
    };
  }
  
  // Xử lý payload đặc biệt
  if (message === "similar") {
    const currentProduct = currentProductStore.get(actualUserId);
    if (currentProduct) {
      return getSimilarProductsReply(currentProduct);
    }
  }
  
  // Lớp 1: Kiểm tra FAQ
  const faqAnswer = findFaqAnswer(normalizedMessage);
  if (faqAnswer) {
    // Clear context nếu người dùng hỏi FAQ (đổi chủ đề)
    clearContext(actualUserId);
    return { type: "text", text: faqAnswer };
  }
  
  // Kiểm tra context trước đó
  const context = getContextForUser(actualUserId);
  
  // Xử lý intent mới để kiểm tra có đổi chủ đề không
  const intent = detectIntent(normalizedMessage);
  const chitchatIntent = detectChitchat(normalizedMessage);
  
  // Clear context nếu người dùng đổi chủ đề hoàn toàn
  if (context && context.currentIntent) {
    const isFAQ = !!faqAnswer;
    const isChitchat = chitchatIntent !== "none";
    const isUnrelatedIntent = intent !== "none" && !isIntentRelatedToContext(intent, context.currentIntent);
    
    // Relax: đừng clear khi chitchat; chỉ clear khi FAQ hoặc đổi sang chủ đề hoàn toàn không liên quan
    if (isFAQ || isUnrelatedIntent) {
      clearContext(actualUserId);
    }
  }
  
  // Lớp 2: Xử lý nghiệp vụ với context (sau khi có thể đã clear)
  const updatedContext = getContextForUser(actualUserId);
  if (updatedContext && updatedContext.currentIntent && updatedContext.missingEntity) {
    // Người dùng đang trả lời câu hỏi từ context trước
    const productEntity = extractProduct(normalizedMessage);
    
    if (updatedContext.currentIntent === "quote_single" && productEntity) {
      clearContext(actualUserId);
      // Lưu sản phẩm hiện tại để xử lý "similar"
      currentProductStore.set(actualUserId, productEntity);
      return getProductReply(productEntity);
    }
    
    if (updatedContext.currentIntent === "consulting") {
      clearContext(actualUserId);
      return getConsultingReply();
    }
  }
  
  // Shortcut: nếu người dùng nhắc tới ngân sách/số tiền -> ưu tiên gợi ý theo ngân sách
  const budgetHint = /(\d+(?:[\.,]\d+)?)(\s*)(k|nghìn|ngan|ngàn|tr|triệu|m|đ|vnd)\b|ngân\s*sách|khoảng\s*\d+/i.test(message);
  if (budgetHint) {
    return getRecommendReply(message);
  }

  // Shortcut: bắt câu hỏi bán chạy nhất/top bán chạy
  const bestsellerHint = /(bán\s*chạy\s*nhất|top\s*bán\s*chạy|sản\s*phẩm\s*bán\s*chạy)/i.test(message);
  if (bestsellerHint) {
    // Nếu hỏi "bán chạy nhất" → trả về top 1
    const askTop1 = /(nhất|top\s*1|#1)/i.test(message);
    return getBestSellersReply(askTop1 ? 1 : 3);
  }

  // Shortcut: ưu tiên xử lý tồn kho nếu câu có từ khoá tồn kho
  const stockHint = /(còn\s*hàng|tồn\s*kho|còn\s*không|hết\s*hàng|số\s*lượng\s*còn|còn\s*bao\s*nhiêu|\bstock\b)/i.test(message);
  if (stockHint) {
    const prodForStock = extractProduct(normalizedMessage) || currentProductStore.get(actualUserId);
    if (prodForStock) {
      currentProductStore.set(actualUserId, prodForStock);
      return getStockInfoReply(prodForStock);
    }
    // Nếu chưa xác định được sản phẩm, gợi ý theo danh mục hiện tại hoặc hỏi lại
    const ctx = getContextForUser(actualUserId) as any;
    const cat = ctx?.lastCategory || mapCategoryFromText(normalizedMessage);
    if (cat) {
      const list = (items as any[]).filter(p => p.categoryId === cat).slice(0, 3);
      if (list.length) {
        const lines = list.map(p => `• ${p.name}`).join('\n');
        return { type: "text", text: `Bạn muốn xem tồn kho của sản phẩm nào trong danh mục ${cat.replace('c:','')}?\n\n${lines}`, quickReplies: list.map(p => ({ text: `Tồn kho ${p.name}`, payload: `còn hàng ${p.name.toLowerCase()}` })) } as any;
      }
    }
    return { type: "text", text: "Bạn muốn kiểm tra tồn kho của sản phẩm nào? Hãy nói tên sản phẩm giúp mình nhé." } as any;
  }

  // Xử lý intent mới
  const productEntity = extractProduct(normalizedMessage);
  const categoryIdFromText = mapCategoryFromText(normalizedMessage);
  if (categoryIdFromText) {
    saveContext(actualUserId, { currentIntent: "list_categories", lastMessage: message, userId: actualUserId, ...( { lastCategory: categoryIdFromText } as any) });
  }
  
  // Debug: Log để kiểm tra
  console.log('Intent:', intent, 'Product Entity:', (productEntity as any)?.name || 'None');
  
  if (intent === "quote_single") {
    // Chỉ trả về sản phẩm nếu có tên sản phẩm cụ thể trong tin nhắn
    if (productEntity && hasSpecificProductName(normalizedMessage)) {
      // Có đủ thông tin -> trả về sản phẩm
      // Lưu sản phẩm hiện tại để xử lý "similar"
      currentProductStore.set(actualUserId, productEntity);
      return getProductReply(productEntity);
    } else {
      // Thiếu thông tin -> hỏi lại và lưu context
      saveContext(actualUserId, { 
        currentIntent: "quote_single", 
        missingEntity: "product_name",
        lastMessage: message 
      });
      return getMissingEntityReply("quote_single");
    }
  }
  
  // Bỏ luồng order_info theo yêu cầu mới

  if (intent === "quote_bulk") {
    return getBulkQuoteReply();
  }
  if (intent === "recommend") {
    // Nếu chưa thấy con số ngân sách → hỏi lại với các lựa chọn nhanh
    const hasNumber = /\d/.test(message);
    if (!hasNumber) {
      return {
        type: "text",
        text: "Bạn đang dự kiến ngân sách khoảng bao nhiêu?",
        quickReplies: [
          { text: "≤ 200k", payload: "gợi ý 200k" },
          { text: "≤ 300k", payload: "gợi ý 300k" },
          { text: "≤ 500k", payload: "gợi ý 500k" }
        ]
      } as any;
    }
    return getRecommendReply(message);
  }
  
  if (intent === "list_categories") {
    // nếu câu chứa tên danh mục -> lưu lại
    if (categoryIdFromText) {
      saveContext(actualUserId, { currentIntent: "list_categories", ...( { lastCategory: categoryIdFromText } as any) });
    }
    return getCategoryListReply();
  }
  
  if (intent === "product_info" && productEntity) {
    currentProductStore.set(actualUserId, productEntity);
    return getProductReply(productEntity);
  }
  if (intent === "product_info" && !productEntity) {
    const current = currentProductStore.get(actualUserId);
    if (current) {
      return getProductReply(current);
    }
  }
  if (intent === "product_info" && !productEntity) {
    const ctx = getContextForUser(actualUserId) as any;
    const cat = ctx?.lastCategory || categoryIdFromText;
    if (cat) {
      const list = (items as any[]).filter(p => p.categoryId === cat).slice(0, 3);
      if (list.length) {
        const lines = list.map(p => `• ${p.name} - ${p.price?.toLocaleString('vi-VN')}đ`).join('\n');
        return { type: "text", text: `Bạn muốn xem sản phẩm nào trong danh mục ${cat.replace('c:','')}?\n\n${lines}`, quickReplies: list.map(p => ({ text: `Xem ${p.name}`, payload: `thông tin ${p.name.toLowerCase()}` })) } as any;
      }
    }
  }
  
  if (intent === "stock_info" && productEntity) {
    currentProductStore.set(actualUserId, productEntity);
    return getStockInfoReply(productEntity);
  }
  if (intent === "stock_info" && !productEntity) {
    const current = currentProductStore.get(actualUserId);
    if (current) {
      return getStockInfoReply(current);
    }
  }
  if (intent === "stock_info" && !productEntity) {
    const ctx = getContextForUser(actualUserId) as any;
    const cat = ctx?.lastCategory || categoryIdFromText;
    if (cat) {
      const list = (items as any[]).filter(p => p.categoryId === cat).slice(0, 3);
      if (list.length) {
        const lines = list.map(p => `• ${p.name} - tồn ${typeof p.stock==='number'?p.stock:'?'}`).join('\n');
        return { type: "text", text: `Bạn đang xem danh mục ${cat.replace('c:','')}. Bạn muốn xem tồn kho sản phẩm nào?\n\n${lines}`, quickReplies: list.map(p => ({ text: `Tồn kho ${p.name}`, payload: `còn hàng ${p.name.toLowerCase()}` })) } as any;
      }
    }
  }
  
  if (intent === "size_info" && productEntity) {
    currentProductStore.set(actualUserId, productEntity);
    return getSizeInfoReply(productEntity);
  }
  if (intent === "size_info" && !productEntity) {
    const current = currentProductStore.get(actualUserId);
    if (current) {
      return getSizeInfoReply(current);
    }
  }
  if (intent === "size_info" && !productEntity) {
    const ctx = getContextForUser(actualUserId) as any;
    const cat = ctx?.lastCategory || categoryIdFromText;
    if (cat) {
      const list = (items as any[]).filter(p => p.categoryId === cat).slice(0, 3);
      if (list.length) {
        const lines = list.map(p => `• ${p.name}`).join('\n');
        return { type: "text", text: `Bạn đang xem danh mục ${cat.replace('c:','')}. Bạn muốn xem size gợi ý cho sản phẩm nào?\n\n${lines}`, quickReplies: list.map(p => ({ text: `Size ${p.name}`, payload: `size ${p.name.toLowerCase()}` })) } as any;
      }
    }
  }
  
  if (intent === "consulting") {
    if (productEntity) {
      // Có sản phẩm cụ thể -> trả về thông tin sản phẩm
      currentProductStore.set(actualUserId, productEntity);
      return getProductReply(productEntity);
    } else {
      // Hỏi về lĩnh vực tư vấn
      saveContext(actualUserId, { 
        currentIntent: "consulting", 
        missingEntity: "product_category",
        lastMessage: message 
      });
      return getMissingEntityReply("consulting");
    }
  }
  
  if (intent === "greeting") {
    return getGreetingReply();
  }
  
  // Lớp 3: Xử lý Chitchat
  if (chitchatIntent === "greeting") {
    return getGreetingReply();
  }
  
  if (chitchatIntent === "thanks") {
    return getThanksReply();
  }
  
  if (chitchatIntent === "goodbye") {
    return getGoodbyeReply();
  }
  
  // Lớp cuối cùng: Fallback thông minh
  return getSmartFallbackReply();
}

function formatOrderForDisplay(payload: any): string {
  const o = payload?.data || payload;
  if (!o) return "Không có dữ liệu đơn hàng.";
  const id = o.id || o.code || "(không rõ mã)";
  const status = o.status || "(không rõ trạng thái)";
  const createdAt = o.createdAt || o.created_at || "";
  const customer = o.customer?.name || o.customer_name || "Khách hàng";
  const phone = o.customer?.phone || o.customer_phone || "";
  const items = Array.isArray(o.items) ? o.items : [];
  const lines = items.slice(0, 10).map((it: any, i: number) => {
    const name = it.name || it.productName || it.title || `Mặt hàng #${i+1}`;
    const qty = it.qty || it.quantity || 1;
    const price = typeof it.unitPrice === 'number' ? it.unitPrice : (it.price || 0);
    const priceStr = typeof price === 'number' ? `${price.toLocaleString('vi-VN')}đ` : '';
    return `• ${name} x${qty} ${priceStr}`;
  }).join("\n");
  const total = o.total || o.totalPrice || 0;
  const totalStr = typeof total === 'number' ? `${total.toLocaleString('vi-VN')}đ` : '';
  return [
    `Đơn hàng ${id}`,
    `Trạng thái: ${status}`,
    createdAt ? `Ngày tạo: ${createdAt}` : "",
    `${customer}${phone ? ` (${phone})` : ''}`,
    lines ? `\nSản phẩm:\n${lines}` : "",
    totalStr ? `\nTổng: ${totalStr}` : ""
  ].filter(Boolean).join("\n");
}


