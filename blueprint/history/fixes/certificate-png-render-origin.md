# Fix: Download PNG fails on Render (wrong internal origin)

**Type:** Fix
**Status:** complete

## The problem

On the deployed Render service, clicking "Download PNG" always failed with a
generic "Failed to generate PNG" error. The server log for a failed request
showed the real cause:

    Error: net::ERR_SSL_PROTOCOL_ERROR at https://localhost:10000/certificate/render?...

`app/api/certificate/png/route.ts` passed `request.nextUrl.origin` into
`goToCertificateRender` (`lib/certificate/render.ts`) as the origin Puppeteer
should navigate to. On Render, the app receives the request internally on
`localhost:10000` (plain HTTP, Render's proxy -> container), but Next.js pairs
that raw `Host` header with the forwarded `https` protocol, producing
`https://localhost:10000` - a URL nothing serves TLS on. Puppeteer then failed
the TLS handshake trying to reach it. This worked locally only because
`next dev` has no proxy in front of it, so `nextUrl.origin` happened to be a
real, reachable `http://localhost:3000`.

Found via a production error report; root-caused from the Render service log
for a failed PNG request.

## The fix

Puppeteer and the Next.js server run in the same container, so the internal
render navigation should never go through the public origin, proxy, or TLS at
all. `lib/certificate/render.ts` gained a `getInternalOrigin()` helper that
builds `http://127.0.0.1:${process.env.PORT ?? 3000}` directly - the same port
`next start` itself binds to (confirmed by the log showing port `10000`,
Render's actual `PORT` value). `goToCertificateRender` no longer takes an
`origin` parameter; `app/api/certificate/png/route.ts` no longer passes
`request.nextUrl.origin`.

## Build steps

- [x] **Add `getInternalOrigin()` and drop the `origin` parameter** -
  `lib/certificate/render.ts` builds the internal render URL directly from
  `PORT`; `app/api/certificate/png/route.ts` no longer passes
  `request.nextUrl.origin`. *Done when:* `npm run typecheck` passes, and a
  redeploy on Render successfully downloads a PNG instead of hitting
  `ERR_SSL_PROTOCOL_ERROR`.

## Verify

- `npm run verify` passes (typecheck, 4/4 tests, build).
- Local end-to-end proof: the bundled Puppeteer Chrome-for-Testing build
  cannot launch on the machine used for this fix (unrelated
  `dlopen`/`VideoToolbox` symbol error, reproduced even after a clean
  reinstall of that Chrome build). Verification instead pointed Puppeteer at
  the system-installed Google Chrome via `PUPPETEER_EXECUTABLE_PATH` for one
  local run only (not a code or config change). That run returned
  `200 image/png` from `POST /api/certificate/png` against the local dev
  server, and the rendered certificate was inspected and confirmed correct.
- Follow-up: re-confirm the download works after the actual Render redeploy,
  since that is the environment this bug was specific to.

## Findings

_No findings ledger entries were open against this work._
