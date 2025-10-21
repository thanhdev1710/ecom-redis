import chitchatData from "../data/chitchat.json";
import { advancedNormalize } from "../utils/normalize";

type ChitchatType = "greeting" | "thanks" | "goodbye" | "none";

export function detectChitchat(message: string): ChitchatType {
  const normalizedMessage = advancedNormalize(message);
  
  for (const [type, keywords] of Object.entries(chitchatData)) {
    if (keywords.some(keyword => normalizedMessage.includes(advancedNormalize(keyword)))) {
      return type as ChitchatType;
    }
  }
  
  return "none";
}
