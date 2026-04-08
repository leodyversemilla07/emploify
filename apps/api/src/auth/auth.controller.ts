import { All, Controller, Req, Res } from "@nestjs/common"
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express"

import { auth } from "../lib/auth.js"

@Controller("api/auth")
export class AuthController {
  @All("*path")
  async handleAuth(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    const baseURL =
      process.env.BETTER_AUTH_URL ??
      `http://localhost:${process.env.PORT ?? 4000}`
    const url = new URL(req.originalUrl || req.url, baseURL)

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(", "))
      else if (typeof value === "string") headers.set(key, value)
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body !== undefined && req.body !== null) {
        init.body =
          typeof req.body === "string" ? req.body : JSON.stringify(req.body)
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json")
        }
      }
    }

    const response = await auth.handler(new Request(url, init))

    const setCookies =
      (
        response.headers as Headers & { getSetCookie?: () => string[] }
      ).getSetCookie?.() ?? []
    if (setCookies.length > 0) {
      res.setHeader("set-cookie", setCookies)
    }

    response.headers.forEach((value: string, key: string) => {
      if (key.toLowerCase() !== "set-cookie") {
        res.setHeader(key, value)
      }
    })

    res.status(response.status)
    const body = Buffer.from(await response.arrayBuffer())
    res.send(body)
  }
}
