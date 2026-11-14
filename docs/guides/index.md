# Guides

Practical walkthroughs for integrating `rwsdk-atp` into a RedwoodSDK Cloudflare Workers app.

## Setup

- [Getting Started](./getting-started) — OAuth authentication, session management, and making authenticated AT Protocol API calls
- [Tap Integration](./tap-integration) — receive real-time AT Protocol record events via webhooks and Cloudflare Queues
- [Multiple Queues](./multiple-queues) — wiring up Tap alongside other Cloudflare Queues in the same worker

## Reference

- [Error Classes](./errors) — `AccessError`, `RepositoryError` subclasses, and `StepError`, plus how they map to HTTP responses
- [Logging](./logging) — structured loggers for each Cloudflare runtime context, and guidelines for choosing log levels
- [Middleware](./middleware) — bot protection, security headers, and CORS
