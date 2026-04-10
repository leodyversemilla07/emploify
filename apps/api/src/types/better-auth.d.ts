// Minimal typing for better-auth usage in this project

declare module "better-auth" {
  export function betterAuth(config: unknown): {
    handler: (request: Request) => Promise<Response>
  }
}
