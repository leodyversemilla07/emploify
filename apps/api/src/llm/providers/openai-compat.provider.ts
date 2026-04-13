import OpenAI from "openai"
import type { ChatMessage, ChatOptions } from "../llm.interface.js"
import { LlmProvider } from "../llm.interface.js"

/**
 * Works with any OpenAI-compatible API:
 *  - OpenAI
 *  - Azure OpenAI
 *  - Groq
 *  - Together
 *  - OpenRouter
 *  - Ollama (local)
 *
 * Config via env:
 *   LLM_PROVIDER=openai-compat
 *   LLM_BASE_URL=https://api.openai.com/v1
 *   LLM_API_KEY=sk-...
 *   LLM_MODEL=gpt-4o-mini
 */
export class OpenAiCompatProvider extends LlmProvider {
  readonly name = "openai-compat"
  private client: OpenAI | null = null
  private model: string

  constructor() {
    super()
    const apiKey = process.env.LLM_API_KEY
    const baseURL = process.env.LLM_BASE_URL
    this.model = process.env.LLM_MODEL ?? "gpt-4o-mini"

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        ...(baseURL ? { baseURL } : {}),
      })
      console.log(
        `[LLM] OpenAI-compat provider initialized — ${baseURL ?? "default"} — model: ${this.model}`,
      )
    } else {
      console.log("[LLM] OpenAI-compat provider: no LLM_API_KEY set")
    }
  }

  get isAvailable(): boolean {
    return this.client !== null
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    if (!this.client) {
      throw new Error("OpenAI-compat client not configured")
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      ...(options?.json ? { response_format: { type: "json_object" } } : {}),
    })

    return response.choices[0]?.message?.content ?? ""
  }
}
