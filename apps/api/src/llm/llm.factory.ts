import { LlmProvider } from "./llm.interface.js"
import { OpenAiCompatProvider } from "./providers/openai-compat.provider.js"
import { AnthropicProvider } from "./providers/anthropic.provider.js"

/**
 * Select provider via LLM_PROVIDER env var:
 *   - "openai-compat" (default) — OpenAI, Azure, Groq, Together, OpenRouter, Ollama
 *   - "anthropic"               — Anthropic direct
 *
 * Falls back to a no-op provider when nothing is configured.
 */
export function createLlmProvider(): LlmProvider {
  const providerKey = (
    process.env.LLM_PROVIDER ?? "openai-compat"
  ).toLowerCase()

  console.log(`[LLM] Selecting provider: ${providerKey}`)

  switch (providerKey) {
    case "anthropic":
      return new AnthropicProvider()

    case "openai-compat":
    default:
      return new OpenAiCompatProvider()
  }
}
