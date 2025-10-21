// Fuzzy search (Fuse.js) – optional dependency. If present, we use it first with ~65% match threshold
// npm i fuse.js  (recommended)
let fuzzySearch: ((q: string) => any | null) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Fuse = require('fuse.js');
  const fuse = new Fuse(require('../data/data.json'), {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'brand', weight: 0.2 },
      { name: 'categoryId', weight: 0.1 }
    ],
    includeScore: true,
    threshold: 0.35, // ~65% similarity acceptance
    minMatchCharLength: 2,
    ignoreLocation: true,
  });
  fuzzySearch = (q: string) => {
    const results = fuse.search(q);
    if (!results || results.length === 0) return null;
    const top = results[0];
    if (typeof top.score === 'number' && top.score <= 0.35) return top.item;
    return null;
  };
} catch (_) {
  fuzzySearch = null; // Fuse not installed → fallback below
}

// Fallback implementation hiện tại
import items from "../data/data.json";
import { advancedNormalize } from "../utils/normalize";

type Product = {
  id: string;
  name: string;
  brand?: string;
  categoryId?: string;
};

export function extractProduct(message: string): Product | null {
  const normalizedMessage = advancedNormalize(message);
  // Prefer fuzzy (if available)
  if (fuzzySearch) {
    const found = fuzzySearch(message);
    if (found) return found as Product;
  }
  
  let bestMatch: Product | null = null;
  let bestScore = 0;
  
  for (const product of items as Product[]) {
    const productText = `${product.name} ${product.brand || ''} ${product.categoryId || ''}`;
    const normalizedProduct = advancedNormalize(productText);
    
    const score = calculateProductSimilarity(normalizedMessage, normalizedProduct, product);
    
    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestMatch = product;
    }
  }
  
  return bestMatch;
}

function calculateProductSimilarity(message: string, productText: string, product: Product): number {
  const messageWords = message.split(' ').filter(w => w.length > 1);
  const productWords = productText.split(' ').filter(w => w.length > 1);
  
  if (messageWords.length === 0) return 0;
  
  let matches = 0;
  let totalWeight = 0;
  
  // Ưu tiên tên sản phẩm và thương hiệu
  for (const msgWord of messageWords) {
    let wordWeight = 1;
    
    if (advancedNormalize(product.name).includes(msgWord)) wordWeight = 1.5;
    if (product.brand && advancedNormalize(product.brand).includes(msgWord)) wordWeight = 1.3;
    
    totalWeight += wordWeight;
    
    for (const prodWord of productWords) {
      if (msgWord === prodWord || 
          msgWord.includes(prodWord) || 
          prodWord.includes(msgWord)) {
        matches += wordWeight;
        break;
      }
    }
  }
  
  return matches / totalWeight;
}

export function extractOrderId(message: string): string | null {
  // lấy chuỗi dạng ODxxx, hoặc số thuần, hoặc mã có chữ-số liền nhau
  const m = message.match(/(od\s*\d+|#[a-z0-9-]+|[a-z]{2}\d{3,}|\b\d{5,}\b)/i);
  if (!m) return null;
  return m[0].replace(/[\s#]/g, "");
}