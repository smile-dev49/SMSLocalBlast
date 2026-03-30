# Request context and correlation IDs

## Goals

- Every log and error can be tied to a **single request id**.
- Future auth can populate **user** and **organization** without threading `Request` through every method.

## Implementation

- Middleware runs early (`RequestContextModule`) for all routes.
- Header **`x-request-id`**: reused when present and non-empty; otherwise a UUID is generated.
- **`AsyncLocalStorage`** holds a small immutable context object for the lifetime of the request.

## Fields (current)

| Field            | Source / notes                       |
| ---------------- | ------------------------------------ |
| `requestId`      | Header or generated                  |
| `userId`         | Placeholder until JWT/session wiring |
| `organizationId` | Placeholder until tenant resolution  |
| `ip`             | `req.ip` / socket                    |
| `userAgent`      | `User-Agent` header                  |

## Error responses

`HttpExceptionFilter` reads `x-request-id` from the Express request for the `meta.requestId` field so filters stay decoupled from request-context storage internals.
