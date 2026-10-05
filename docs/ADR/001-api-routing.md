# API routing through Nginx

Status: Accepted

## Context

The platform has a Next.js UI and a separate Express API, with independent
workers planned. The health button previously called a Next.js Route Handler
that fetched Express. The roadmap introduces Nginx for routing and API load
balancing.

## Decision

The browser keeps using relative `/api/v1/*` URLs. Nginx routes these requests
directly to Express and routes page requests to Next.js. Next.js has a
development-only rewrite for developers running without Nginx. There is no
Next.js health Route Handler.

Express owns the health response and disables caching. The browser validates
the payload and handles cancellation, timeout, and proxy failures. The current
endpoint checks process liveness, not dependency readiness.

## Consequences

API traffic through Nginx does not depend on Next.js availability. Both routes
share a browser origin. Production builds must be served behind the configured
reverse proxy; port 3000 alone does not provide `/api/v1/*` routing.

The development rewrite still forwards traffic through Next.js. It is a local
convenience, not the architecture used to measure independent API scaling.
Proxy failures may return non-JSON responses, so the frontend checks HTTP status
before parsing JSON. Authorization and tenant isolation remain Express
responsibilities. Selected BFF endpoints may be added when a concrete UI need
justifies them.

The initial Compose service runs only Nginx and reaches API/web processes on
the host. Containerizing applications and adding API replicas are future steps.
This decision makes no latency claim; compare paths with load tests later.
