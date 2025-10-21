import faqData from "../data/faq.json";
import { advancedNormalize } from "../utils/normalize";

type FAQItem = {
  id: string;
  questions: string[];
  answer: string;
};

export function findFaqAnswer(message: string): string | null {
  const normalizedMessage = advancedNormalize(message);
  
  for (const faq of faqData as FAQItem[]) {
    for (const question of faq.questions) {
      const normalizedQuestion = advancedNormalize(question);
      
      // Kiểm tra độ tương đồng đơn giản
      if (normalizedMessage.includes(normalizedQuestion) || 
          normalizedQuestion.includes(normalizedMessage) ||
          calculateSimilarity(normalizedMessage, normalizedQuestion) > 0.7) {
        return faq.answer;
      }
    }
  }
  
  return null;
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}
