// OpenRouter API utility for Eureka
// Only uses paid models, tries multiple in order

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE || "Eureka";

// List of paid models to try (add/remove as needed)
export const PAID_MODELS = [
  "openai/gpt-4o", // OpenAI GPT-4o
  "openai/gpt-4-turbo", // OpenAI GPT-4 Turbo
  "anthropic/claude-3-opus", // Claude 3 Opus
  "anthropic/claude-3-sonnet", // Claude 3 Sonnet
  "anthropic/claude-3-haiku", // Claude 3 Haiku
  "google/gemini-pro", // Gemini Pro
  "meta-llama/llama-3-70b-instruct", // Llama 3 70B
  "mistralai/mistral-large", // Mistral Large
  "perplexity/pplx-70b-online", // Perplexity 70B Online
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
