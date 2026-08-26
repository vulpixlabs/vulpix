import { brandAssetUrl } from "@/lib/brand-logos";

export type ProviderKind = "openai" | "anthropic" | "google" | "compatible";

export interface ProviderDef {
  id: string;
  name: string;
  kind: ProviderKind;
  baseURL?: string;
  fallbackModels: string[];
  keyPrefix?: string;
  docs?: string;
  logo?: string;
  local?: boolean;
}

const PROVIDER_DEFS: ProviderDef[] = [
  { id: "openai", name: "OpenAI", kind: "openai", fallbackModels: ["gpt-5.4", "gpt-4.1", "gpt-4o", "o4-mini"], keyPrefix: "sk-", docs: "https://platform.openai.com/api-keys", logo: "https://svgl.app/library/openai.svg" },
  { id: "anthropic", name: "Anthropic", kind: "anthropic", fallbackModels: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5"], keyPrefix: "sk-ant-", docs: "https://console.anthropic.com/settings/keys", logo: "https://cdn.simpleicons.org/anthropic/000000" },
  { id: "google", name: "Google Gemini", kind: "google", fallbackModels: ["gemini-3-pro", "gemini-3-flash", "gemini-2.5-pro", "gemini-2.5-flash"], keyPrefix: "AI", docs: "https://aistudio.google.com/apikey", logo: "https://cdn.simpleicons.org/googlegemini/000000" },
  { id: "openrouter", name: "OpenRouter", kind: "compatible", baseURL: "https://openrouter.ai/api/v1", fallbackModels: ["openai/gpt-4.1", "anthropic/claude-sonnet-4.5", "google/gemini-2.5-pro", "meta-llama/llama-4-maverick", "deepseek/deepseek-r1"], keyPrefix: "sk-or-", docs: "https://openrouter.ai/keys", logo: "https://cdn.simpleicons.org/openrouter/000000" },
  { id: "groq", name: "Groq", kind: "compatible", baseURL: "https://api.groq.com/openai/v1", fallbackModels: ["llama-3.3-70b-versatile", "llama-4-scout-17b-16e-instruct", "qwen/qwen3-32b", "deepseek-r1-distill-llama-70b"], keyPrefix: "gsk_", docs: "https://console.groq.com/keys", logo: "https://svgl.app/library/groq.svg" },
  { id: "deepseek", name: "DeepSeek", kind: "compatible", baseURL: "https://api.deepseek.com/v1", fallbackModels: ["deepseek-chat", "deepseek-reasoner"], keyPrefix: "sk-", docs: "https://platform.deepseek.com/api_keys", logo: "https://cdn.simpleicons.org/deepseek/000000" },
  { id: "mistral", name: "Mistral AI", kind: "compatible", baseURL: "https://api.mistral.ai/v1", fallbackModels: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "codestral-latest"], docs: "https://console.mistral.ai/api-keys", logo: "https://cdn.simpleicons.org/mistralai/000000" },
  { id: "xai", name: "xAI Grok", kind: "compatible", baseURL: "https://api.x.ai/v1", fallbackModels: ["grok-4", "grok-3", "grok-3-mini"], keyPrefix: "xai-", docs: "https://console.x.ai", logo: "https://svgl.app/library/grok-light.svg" },
  { id: "together", name: "Together AI", kind: "compatible", baseURL: "https://api.together.xyz/v1", fallbackModels: ["meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", "deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-235B-A22B-fp8-tput"], docs: "https://api.together.ai/settings/api-keys", logo: "https://svgl.app/library/togetherai_light.svg" },
  { id: "fireworks", name: "Fireworks AI", kind: "compatible", baseURL: "https://api.fireworks.ai/inference/v1", fallbackModels: ["accounts/fireworks/models/llama4-maverick-instruct-basic", "accounts/fireworks/models/deepseek-v3", "accounts/fireworks/models/qwen3-235b-a22b"], docs: "https://fireworks.ai/account/api-keys", logo: "https://www.google.com/s2/favicons?domain=fireworks.ai&sz=64" },
  { id: "cerebras", name: "Cerebras", kind: "compatible", baseURL: "https://api.cerebras.ai/v1", fallbackModels: ["llama-4-scout-17b-16e-instruct", "llama3.3-70b", "qwen-3-235b-a22b-instruct-2507"], docs: "https://cloud.cerebras.ai", logo: "https://svgl.app/library/cerebras-dark.svg" },
  { id: "perplexity", name: "Perplexity", kind: "compatible", baseURL: "https://api.perplexity.ai", fallbackModels: ["sonar-pro", "sonar", "sonar-reasoning-pro"], keyPrefix: "pplx-", docs: "https://www.perplexity.ai/settings/api", logo: "https://cdn.simpleicons.org/perplexity/000000" },
  { id: "cohere", name: "Cohere", kind: "compatible", baseURL: "https://api.cohere.ai/compatibility/v1", fallbackModels: ["command-a-03-2025", "command-r-plus-08-2024"], docs: "https://dashboard.cohere.com/api-keys", logo: "https://svgl.app/library/cohere.svg" },
  { id: "deepinfra", name: "DeepInfra", kind: "compatible", baseURL: "https://api.deepinfra.com/v1/openai", fallbackModels: ["meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", "deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-235B-A22B"], docs: "https://deepinfra.com/dash/api_keys", logo: "https://www.google.com/s2/favicons?domain=deepinfra.com&sz=64" },
  { id: "sambanova", name: "SambaNova", kind: "compatible", baseURL: "https://api.sambanova.ai/v1", fallbackModels: ["Meta-Llama-4-Maverick-17B-128E-Instruct", "DeepSeek-V3-0324", "Qwen3-235B-A22B-Instruct-2507"], docs: "https://cloud.sambanova.ai/apis", logo: "https://www.google.com/s2/favicons?domain=sambanova.ai&sz=64" },
  { id: "nebius", name: "Nebius AI Studio", kind: "compatible", baseURL: "https://api.studio.nebius.ai/v1", fallbackModels: ["meta-llama/Llama-4-Maverick-17B-128E-Instruct", "deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-235B-A22B"], keyPrefix: "nvapi-", docs: "https://studio.nebius.ai/settings/api-keys", logo: "https://www.google.com/s2/favicons?domain=nebius.com&sz=64" },
  { id: "novita", name: "Novita AI", kind: "compatible", baseURL: "https://api.novita.ai/v3/openai", fallbackModels: ["meta-llama/llama-4-maverick-instruct-basic", "deepseek/deepseek-v3", "qwen/qwen3-235b-a22b-fp8"], docs: "https://novita.ai/dashboard/key", logo: "https://www.google.com/s2/favicons?domain=novita.ai&sz=64" },
  { id: "huggingface", name: "Hugging Face Router", kind: "compatible", baseURL: "https://router.huggingface.co/v1", fallbackModels: ["deepseek-ai/DeepSeek-V3-0324", "Qwen/Qwen3-235B-A22B", "meta-llama/Llama-4-Maverick-17B-128E-Instruct"], keyPrefix: "hf_", docs: "https://huggingface.co/settings/tokens", logo: "https://cdn.simpleicons.org/huggingface/000000" },
  { id: "vercel-gateway", name: "Vercel AI Gateway", kind: "compatible", baseURL: "https://ai-gateway.vercel.sh/v1", fallbackModels: ["openai/gpt-4.1", "anthropic/claude-sonnet-4.5", "google/gemini-2.5-pro"], docs: "https://vercel.com/d?to=/[team]/~/ai", logo: "https://svgl.app/library/vercel_dark.svg" },
  { id: "zai", name: "Z.ai GLM", kind: "compatible", baseURL: "https://api.z.ai/api/paas/v4", fallbackModels: ["glm-4.7", "glm-4.6", "glm-4.5-air"], docs: "https://z.ai/manage-apikey/apikey-list", logo: "https://www.google.com/s2/favicons?domain=z.ai&sz=64" },
  { id: "moonshot", name: "Moonshot Kimi", kind: "compatible", baseURL: "https://api.moonshot.ai/v1", fallbackModels: ["kimi-k2-0905-preview", "kimi-k2-turbo-preview", "moonshot-v1-128k"], keyPrefix: "sk-", docs: "https://platform.moonshot.ai/console/api-keys", logo: "https://cdn.simpleicons.org/moonshotai/000000" },
  { id: "minimax", name: "MiniMax", kind: "compatible", baseURL: "https://api.minimax.io/v1", fallbackModels: ["MiniMax-M2", "MiniMax-Text-01", "abab6.5s-chat"], keyPrefix: "eyJ", docs: "https://platform.minimax.io/user-center/basic-information/interface-key", logo: "https://cdn.simpleicons.org/minimax/000000" },
  { id: "dashscope", name: "Qwen DashScope", kind: "compatible", baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", fallbackModels: ["qwen3-235b-a22b", "qwen-max", "qwen-plus"], keyPrefix: "sk-", docs: "https://bailian.console.alibabacloud.com", logo: "https://cdn.simpleicons.org/qwen/000000" },
  { id: "zhipu", name: "Zhipu BigModel", kind: "compatible", baseURL: "https://open.bigmodel.cn/api/paas/v4", fallbackModels: ["glm-4.7", "glm-4.6", "glm-4.5-air"], keyPrefix: "id.", docs: "https://open.bigmodel.cn/usercenter/apikeys", logo: "https://www.google.com/s2/favicons?domain=zhipuai.cn&sz=64" },
  { id: "siliconflow", name: "SiliconFlow", kind: "compatible", baseURL: "https://api.siliconflow.com/v1", fallbackModels: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-235B-A22B", "moonshotai/Kimi-K2-Instruct"], keyPrefix: "sk-", docs: "https://cloud.siliconflow.com/account/ak", logo: "https://www.google.com/s2/favicons?domain=siliconflow.com&sz=64" },
  { id: "ollama", name: "Ollama (local)", kind: "compatible", baseURL: "http://localhost:11434/v1", fallbackModels: ["llama4:latest", "qwen3:32b", "deepseek-r1:32b", "gemma3:27b"], local: true, docs: "https://ollama.com", logo: "https://svgl.app/library/ollama_light.svg" },
  { id: "lmstudio", name: "LM Studio (local)", kind: "compatible", baseURL: "http://localhost:1234/v1", fallbackModels: ["openai/gpt-oss-20b", "qwen/qwen3-30b-a3b"], local: true, docs: "https://lmstudio.ai", logo: "https://cdn.simpleicons.org/lmstudio/000000" },
];

export const PROVIDERS: ProviderDef[] = PROVIDER_DEFS.map((provider) => ({
  ...provider,
  logo: brandAssetUrl(provider.id),
}));

export const providerById = (id: string) => PROVIDERS.find((p) => p.id === id);
