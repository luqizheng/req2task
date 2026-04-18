export interface ProviderDefaults {
  baseUrl?: string;
  modelName?: string;
}

export const providerDefaults: Record<string, ProviderDefaults> = {
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    modelName: "deepseek-chat",
  },
  openai: {
    baseUrl: "https://api.openai.com",
    modelName: "gpt-4o-mini",
  },
  ollama: {
    baseUrl: "http://localhost:11434",
    modelName: "llama3.2",
  },
};

const PROVIDER_NAMES: Record<string, string> = {
  deepseek: "DeepSeek",
  openai: "OpenAI",
  ollama: "Ollama",
};

const PROVIDER_TAG_TYPES: Record<string, string> = {
  deepseek: "primary",
  openai: "success",
  ollama: "warning",
};

export const getProviderName = (provider: string) => {
  return PROVIDER_NAMES[provider] || provider;
};

export const getProviderTagType = (provider: string) => {
  return PROVIDER_TAG_TYPES[provider] || "";
};

export const maskApiKey = (apiKey?: string) => {
  if (!apiKey || apiKey.length < 8) return "****";
  return apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length - 4);
};
