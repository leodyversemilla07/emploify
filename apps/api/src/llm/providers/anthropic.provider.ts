import Anthropic from "@anthropic-ai/sdk"
import type { ChatMessage, ChatOptions } from "../llm.interface.js"
import { LlmProvider } from "../llm.interface.js"

/**
 * Direct Anthropic provider.
 *
 * Config via env:
 *   LLM_PROVIDER=anthropic
 *   LLM_API_KEY=sk-ant-...
 *   LLM_MODEL=claude-sonnet-4-20250514
 */
export class AnthropicProvider extends LlmProvider {
  readonly name = "anthropic"
  private client: Anthropic | null = null
  private model: string

  constructor() {
    super()
    const apiKey = process.env.LLM_API_KEY
    this.model = process.env.LLM_MODEL ?? "claude-sonnet-4-20250514"

    if (apiKey) {
      this.client = new Anthropic({ apiKey })
      console.log(
        `[LLM] Anthropic provider initialized — model: ${this.model}`,
      )
    } else {
      console.log("[LLM] Anthropic provider: no LLM_API_KEY set")
    }
  }

  get isAvailable(): boolean {
    return this.client !== null
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    if (!this.client) {
      throw new Error("Anthropic client not configured")
    }

    // Anthropic requires system message to be separate
    const systemMsg = messages.find((m) => m.role === "system")
    const conversationMsgs = messages
      .filter((m): m is { role: "user" | "assistant"; content: string } =>
        m.role !== "system",
      )
      .map((m) => ({ role: m.role, content: m.content }))

    // Anthropic needs messages to start with user role
    if (conversationMsgs.length === 0 || conversationMsgs[0].role !== "user") {
      conversationMsgs.unshift({ role: "user", content: "Continue." })
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: conversationMsgs,
    })

    const block = response.content[0]
    return block?.type === "text" ? block.text : ""
  }
}
