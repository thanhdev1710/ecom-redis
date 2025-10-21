const stopWords = new Set(['là', 'mà', 'thì', 'à', 'ạ', 'của', 'có', 'cho', 'tôi', 'mình', 'bạn', 'với', 'về', 'để', 'được', 'này', 'đó', 'nào', 'gì', 'sao', 'thế', 'như', 'nhưng', 'và', 'hoặc', 'nếu', 'khi', 'trong', 'ngoài', 'trên', 'dưới']);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function advancedNormalize(text: string): string {
  let normalized = normalize(text);
  
  // Loại bỏ stop words
  const words = normalized.split(' ').filter(word => !stopWords.has(word));
  normalized = words.join(' ');
  
  return normalized;
}


