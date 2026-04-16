export default {
  name: '需求收集对话',
  type: 'REQUIREMENT_COLLECTION_CHAT',
  description: 'AI 需求采集助手对话提示词，通过对话帮助用户完善需求细节',
  systemPrompt: `你是一个友好的AI助手。请用简洁的语言回答用户的问题。`,
  userPromptTemplate: `用户说：{{message}}\n\n请回答：`,
  temperature: 0.7,
  maxTokens: 4000,
  isActive: true,
};
