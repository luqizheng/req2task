export function generateId(prefix: string = 'msg'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}-${timestamp}-${random}`;
}

export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
