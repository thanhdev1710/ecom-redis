// Simple in-memory context store (in production, use Redis or database)
const userContexts = new Map<string, UserContext>();

type UserContext = {
  userId: string;
  currentIntent?: string;
  missingEntity?: string;
  lastMessage?: string;
  timestamp: number;
};

export function getContextForUser(userId: string): UserContext | null {
  const context = userContexts.get(userId);
  
  // Xóa context cũ (quá 10 phút)
  if (context && Date.now() - context.timestamp > 10 * 60 * 1000) {
    userContexts.delete(userId);
    return null;
  }
  
  return context || null;
}

export function saveContext(userId: string, context: Partial<UserContext>): void {
  const existingContext = getContextForUser(userId) || { userId, timestamp: Date.now() };
  
  userContexts.set(userId, {
    ...existingContext,
    ...context,
    timestamp: Date.now()
  });
}

export function clearContext(userId: string): void {
  userContexts.delete(userId);
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
