export interface ProviderDefaults {
  baseUrl?: string
  modelName?: string
}

export const providerDefaults: Record<string, ProviderDefaults> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    modelName: 'deepseek-chat',
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    modelName: 'gpt-4o-mini',
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    modelName: 'llama3.2',
  },
}

const PROVIDER_NAMES: Record<string, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  ollama: 'Ollama',
}

const PROVIDER_CLASS_NAMES: Record<string, string> = {
  deepseek: 'bg-blue-100 text-blue-700 border-blue-300',
  openai: 'bg-green-100 text-green-700 border-green-300',
  ollama: 'bg-orange-100 text-orange-700 border-orange-300',
}

export const getProviderName = (provider: string) => {
  return PROVIDER_NAMES[provider] || provider
}

export const getProviderClass = (provider: string): string => {
  return PROVIDER_CLASS_NAMES[provider] || 'bg-gray-100 text-gray-700 border-gray-300'
}

export const maskApiKey = (apiKey?: string) => {
  if (!apiKey || apiKey.length < 8) return '****'
  return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4)
}
