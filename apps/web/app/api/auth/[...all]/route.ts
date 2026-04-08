const API_BASE_URL = (process.env.API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  ""
)

async function proxyAuthRequest(
  request: Request,
  context: { params: Promise<{ all: string[] }> }
) {
  const { all } = await context.params
  const search = new URL(request.url).search
  const upstreamUrl = `${API_BASE_URL}/api/auth/${all.join("/")}${search}`

  const headers = new Headers(request.headers)
  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text()
  }

  const response = await fetch(upstreamUrl, init)
  const proxyHeaders = new Headers(response.headers)
  proxyHeaders.set("x-proxy-upstream", upstreamUrl)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: proxyHeaders,
  })
}

export const GET = proxyAuthRequest
export const POST = proxyAuthRequest
export const PUT = proxyAuthRequest
export const PATCH = proxyAuthRequest
export const DELETE = proxyAuthRequest
