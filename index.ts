/**
 * Xiaomi MiMo Provider Extension for Pi
 *
 * https://github.com/AnthonyFangqing/pi-provider-xiaomi-mimo
 *
 * Provides access to Xiaomi MiMo AI models via the MiMo API Open Platform.
 * Supports both Token Plan subscription and pay-as-you-go API access.
 *
 * Usage:
 *   pi -e path/to/pi-provider-xiaomi-mimo
 *   /login → "Use a subscription" → xiaomi-mimo
 *
 * Or set MIMO_API_KEY=tp-xxxxx (or sk-xxxxx) as an environment variable.
 */

import type { OAuthCredentials, OAuthLoginCallbacks } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// -- Base URLs ----------------------------------------------------------------

const PAYG_BASE_URL = "https://api.xiaomimimo.com/v1";

const TOKEN_PLAN_CLUSTERS: Record<string, string> = {
	sgp: "https://token-plan-sgp.xiaomimimo.com/v1",
	ams: "https://token-plan-ams.xiaomimimo.com/v1",
	cn: "https://token-plan-cn.xiaomimimo.com/v1",
};

const DEFAULT_CLUSTER = "sgp";

function baseUrlForKey(apiKey: string): string {
	if (apiKey.startsWith("sk-")) return PAYG_BASE_URL;
	const cluster = process.env.MIMO_CLUSTER ?? DEFAULT_CLUSTER;
	return TOKEN_PLAN_CLUSTERS[cluster] ?? TOKEN_PLAN_CLUSTERS[DEFAULT_CLUSTER];
}

function resolveBaseUrl(): string {
	if (process.env.MIMO_BASE_URL) return process.env.MIMO_BASE_URL;
	const apiKey = process.env.MIMO_API_KEY ?? "";
	return baseUrlForKey(apiKey || "tp-"); // default to Token Plan
}

// -- OpenAI-compat settings ---------------------------------------------------
//
// MiMo is OpenAI-compatible with DeepSeek-style thinking:
//   thinking: { type: "enabled" | "disabled" }
//   reasoning_content in streaming + non-streaming responses
//   reasoning_content must be replayed in assistant messages across turns
//   max_completion_tokens (not max_tokens)
//   "system" role (not "developer")

const COMPAT = {
	thinkingFormat: "deepseek" as const,
	maxTokensField: "max_completion_tokens" as const,
	supportsDeveloperRole: false,
	requiresReasoningContentOnAssistantMessages: true,
	supportsUsageInStreaming: true,
};

// -- Models -------------------------------------------------------------------

const MODELS = [
	{
		id: "mimo-v2.5-pro",
		name: "MiMo V2.5 Pro",
		reasoning: true,
		input: ["text" as const],
		cost: { input: 1.0, output: 3.0, cacheRead: 0.2, cacheWrite: 0 },
		contextWindow: 1_000_000,
		maxTokens: 131_072,
		compat: COMPAT,
	},
	{
		id: "mimo-v2.5",
		name: "MiMo V2.5",
		reasoning: true,
		input: ["text" as const, "image" as const],
		cost: { input: 0.4, output: 2.0, cacheRead: 0.08, cacheWrite: 0 },
		contextWindow: 1_000_000,
		maxTokens: 131_072,
		compat: COMPAT,
	},
	{
		id: "mimo-v2-pro",
		name: "MiMo V2 Pro",
		reasoning: true,
		input: ["text" as const],
		cost: { input: 1.0, output: 3.0, cacheRead: 0.2, cacheWrite: 0 },
		contextWindow: 1_000_000,
		maxTokens: 131_072,
		compat: COMPAT,
	},
	{
		id: "mimo-v2-omni",
		name: "MiMo V2 Omni",
		reasoning: true,
		input: ["text" as const, "image" as const],
		cost: { input: 0.4, output: 2.0, cacheRead: 0.08, cacheWrite: 0 },
		contextWindow: 262_144,
		maxTokens: 131_072,
		compat: COMPAT,
	},
	{
		id: "mimo-v2-flash",
		name: "MiMo V2 Flash",
		reasoning: true,
		input: ["text" as const],
		cost: { input: 0.1, output: 0.3, cacheRead: 0.01, cacheWrite: 0 },
		contextWindow: 262_144,
		maxTokens: 65_536,
		compat: COMPAT,
	},
];

// -- /login -------------------------------------------------------------------

async function loginMimo(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
	const apiKey = await callbacks.onPrompt({
		message: "Enter your MiMo API key (tp-xxxxx or sk-xxxxx):",
		placeholder: "tp-...",
	});
	if (!apiKey) throw new Error("No API key provided");
	return { refresh: apiKey, access: apiKey, expires: Date.now() + 365 * 24 * 60 * 60 * 1000 };
}

// -- Registration -------------------------------------------------------------

export default function (pi: ExtensionAPI) {
	pi.registerProvider("xiaomi-mimo", {
		baseUrl: resolveBaseUrl(),
		apiKey: "MIMO_API_KEY",
		// MiMo's primary auth header is "api-key"; the OpenAI SDK also sends
		// "Authorization: Bearer" automatically. Both methods work.
		headers: { "api-key": "MIMO_API_KEY" },
		api: "openai-completions",
		models: MODELS,
		oauth: {
			name: "Xiaomi MiMo",
			login: loginMimo,
			refreshToken: async (creds) => creds,
			getApiKey: (creds) => creds.access,
			// After /login, swap baseUrl to match the key type.
			// tp- keys → Token Plan cluster, sk- keys → pay-as-you-go.
			modifyModels: (models, creds) =>
				models.map((m) =>
					m.provider === "xiaomi-mimo" ? { ...m, baseUrl: baseUrlForKey(creds.access) } : m,
				),
		},
	});
}
