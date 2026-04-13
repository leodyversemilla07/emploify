import { Module, Global } from "@nestjs/common"
import { LlmProvider } from "./llm.interface.js"
import { createLlmProvider } from "./llm.factory.js"

@Global()
@Module({
  providers: [
    {
      provide: LlmProvider,
      useFactory: () => createLlmProvider(),
    },
  ],
  exports: [LlmProvider],
})
export class LlmModule {}
