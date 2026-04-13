export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type ChatOptions = {
  temperature?: number
  maxTokens?: number
  json?: boolean
}

export abstract class LlmProvider {
  abstract readonly name: string

  abstract chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string>

  get isAvailable(): boolean {
    return true
  }
}
