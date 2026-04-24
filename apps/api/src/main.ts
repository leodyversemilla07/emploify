import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module.js"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS for frontend
  const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:3000"
  ).split(",").map((s) => s.trim())
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`🚀 API running on http://localhost:${port}`)
}

bootstrap()
