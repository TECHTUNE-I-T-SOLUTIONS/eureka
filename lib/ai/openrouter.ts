// OpenRouter API utility for Eureka
// Tries high-quality models first, then falls back to free models when credits are low

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE || "Eureka";

// List of models to try in priority order
export const PAID_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-haiku-4.5",
  "meta-llama/llama-3.3-70b-instruct",
  "qwen/qwen-2.5-72b-instruct",
  // Resilient free fallbacks when credits are low or exhausted
  "recursive/flint-v1.0:free",
  "liquid/lfm-2.5-2.6b:free",
  "google/gemma-4-26b-a4b-it:free",
];

export async function openrouterChat({
  messages,
  modelList = PAID_MODELS,
  temperature = 0.7,
  max_tokens = 2048,
}: {
  messages: Array<{ role: string; content: string }>;
  modelList?: string[];
  temperature?: number;
  max_tokens?: number;
}) {
  for (const model of modelList) {
    try {
      // Free models often enforce smaller token windows (e.g. 500-1000 tokens)
      const effectiveMaxTokens = model.includes(":free") ? Math.min(max_tokens, 1000) : max_tokens;

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": APP_URL,
          "X-Title": APP_TITLE,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: effectiveMaxTokens,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Model ${model} failed:`, response.status, errorText.substring(0, 200));
        continue;
      }
      const result = await response.json();
      const content = result?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        console.warn(`Model ${model} returned empty response`);
        continue;
      }
      return { content, model };
    } catch (error) {
      console.warn(`Model ${model} error:`, error instanceof Error ? error.message : error);
      continue;
    }
  }
  throw new Error("All OpenRouter models failed or rate-limited.");
}
