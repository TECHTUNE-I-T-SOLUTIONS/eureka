// OpenRouter API utility for Eureka
// Only uses paid models, tries multiple in order

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE || "Eureka";

// List of paid models to try (updated 2025 - use current available models)
export const PAID_MODELS = [
  "openai/gpt-4o-mini", // OpenAI GPT-4o Mini (cheaper, good performance)
  "openai/gpt-4o", // OpenAI GPT-4o
  "anthropic/claude-3.5-sonnet", // Claude 3.5 Sonnet
  "anthropic/claude-3.5-haiku", // Claude 3.5 Haiku
  "anthropic/claude-haiku-4.5", // Claude Haiku 4.5
  "google/gemini-2.0-flash-exp", // Gemini 2.0 Flash Experimental
  "google/gemini-1.5-flash", // Gemini 1.5 Flash
  "meta-llama/llama-3.3-70b-instruct", // Llama 3.3 70B
  "mistralai/mistral-large-2402", // Mistral Large 2402
  "qwen/qwen-2.5-72b-instruct", // Qwen 2.5 72B
  // Add more as desired
];

export async function openrouterChat({ messages, modelList = PAID_MODELS, temperature = 0.7, max_tokens = 2048 }) {
  for (const model of modelList) {
    try {
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
          max_tokens,
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
