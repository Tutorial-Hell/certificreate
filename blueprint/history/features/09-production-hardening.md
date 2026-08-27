# Feature: Production hardening on Render

**From build-plan:** feature 9
**Status:** complete

## Goal

Get the render pipeline ready for real production traffic on Render: prove the
concurrency queue actually limits concurrent renders (currently untested),
make the concurrency cap tunable per instance size without a redeploy, emit
enough observability to judge whether an instance is sized correctly, add the
health check path Render needs, and give the user a way to generate real
concurrent load against a deployed instance to actually run the "instance
sizing" and "queue under load" checks the build-plan names.

## In scope

- `lib/puppeteer/browser.ts`'s concurrency cap becomes configurable via a
  `CERTIFICATE_RENDER_CONCURRENCY` env var (falls back to the current default
  of 2 for anything missing or invalid), so instance sizing can be tuned on
  Render without a code change.
- Test coverage proving the render queue actually enforces its concurrency
  cap and that queued requests still complete - this logic has had zero
  tests since it was written in feature 3.
- Lightweight, structured logging per render (queue wait time, render time,
  process memory) so real behavior under production load is observable in
  Render's logs.
- A health check route (`/api/health`) Render's health check can point at,
  closing the open TODO in `project-overview.md`'s Deployment section -
  intentionally decoupled from Puppeteer/browser readiness (see **Notes for
  the AI**).
- A small local dev script that fires concurrent requests at a given PNG
  export URL, so the user has a concrete way to generate the "real renders"
  the build-plan's instance-sizing and queue checks need, against either a
  local server or the real deployed Render URL.

## Out of scope

- Actually running the instance-sizing check or the concurrent-load check
  against the live Render deployment - that needs a real deployed instance
  and is a manual step the user runs after this feature ships, using the
  logging and script this feature adds. Not something `/implement` can do
  from a local session.
- Actually configuring a custom domain in Render's dashboard and DNS - pure
  ops, no code involved. Deferred to a manual step (optionally guided later
  by `/release`), not a build step here.
- Adding a `## 8. Deployment` section to `project-plan.md` and re-running
  `/overview` - `project-plan.md` is a user-owned plan; recommended as a
  follow-up after this feature. **Done separately, after this feature's
  steps, with explicit user approval - see the note at the end.**
- Any change to the actual template-rendering or PNG/PDF generation logic
  itself (`render.ts`, the templates) - this feature only touches the queue,
  observability, and deployment-readiness surface around it.
- Rate limiting or abuse protection on the export routes - not named in the
  build-plan line, would be new scope beyond "hardening" the existing design.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Configurable concurrency cap + queue test coverage** -
  `lib/puppeteer/browser.ts`: extract `parseConcurrency(value: string |
  undefined): number` (pure - returns the parsed value only if it's a
  positive integer, otherwise falls back to the current default of 2; never
  throws on a malformed env value) and read `MAX_CONCURRENT_RENDERS` from
  `parseConcurrency(process.env.CERTIFICATE_RENDER_CONCURRENCY)`.
  `lib/puppeteer/browser.test.ts` (new): mocks `puppeteer.launch` (no real
  Chrome involved, so this is unaffected by the local Chrome/Puppeteer
  environment issue noted below) and drives `withPage` as a black box -
  firing more concurrent calls than the cap and asserting the actual
  concurrent-execution count (tracked by the test via a counter inside the
  functions passed to `withPage`, not by reaching into the module's
  internals) never exceeds it, that every call eventually resolves, that a
  page is always closed even when the render function throws, and that the
  browser is only launched once across multiple calls. Plus unit tests for
  `parseConcurrency` itself (undefined, a valid integer string, `"0"`,
  `"-1"`, `"abc"`, `"2.5"`). *Done when:* `npm run test` passes with the new
  suite; setting `CERTIFICATE_RENDER_CONCURRENCY=1` and firing two real
  concurrent PNG requests locally shows the second visibly wait for the
  first (manual check, once local Puppeteer is available - see **Notes for
  the AI**).

- [x] **Step 2 - Per-render observability logging** - `lib/puppeteer/browser.ts`:
  `withPage` times the queue-wait (time spent in `acquireSlot`) and the
  render itself separately, and on successful completion logs one
  structured line - queue wait ms, render ms, current RSS memory in MB, and
  current active-render count - so this is visible in Render's log stream
  without adding a logging dependency. Error paths are unchanged (the PNG
  and PDF routes already log failures). *Done when:* a successful local PNG
  or PDF export (once local Puppeteer is available) prints one log line with
  all four numbers; `npm run test` and `npm run build` still pass (no test
  added here - this is a logging side effect on an integration path, exempt
  per `coding-standards.md`).

- [x] **Step 3 - Health check route** - `app/api/health/route.ts` (new): a
  `GET` handler returning `{ status: "ok" }` with a 200 status. Deliberately
  does not touch `getBrowser()` or launch/check Puppeteer - see **Notes for
  the AI** for why. *Done when:* `curl http://localhost:3000/api/health`
  (or the equivalent browser check) returns `200 { "status": "ok" }` even
  when Puppeteer itself is unavailable (verifiable right now, given the
  local Puppeteer/Chrome issue, which is exactly the scenario this
  decoupling protects against).

- [x] **Step 4 - Local concurrent-load script** - `scripts/load-test.mjs`
  (new, plain Node, no new dependency): takes a target URL and a
  concurrency count from CLI args (e.g. `node scripts/load-test.mjs
  http://localhost:3000/api/certificate/png 5`), fires that many concurrent
  POSTs with a small fixed sample payload, and prints per-request timing and
  pass/fail. Documented with a one-line usage comment at the top of the
  file. *Done when:* running it against a working export endpoint (local or
  a real deployed Render URL, once available) prints timing for each
  concurrent request and a summary; not part of the Next.js app itself, not
  wired into `npm run verify`.

## Files / areas

- `lib/puppeteer/browser.ts` (modified - configurable cap, observability logging)
- `lib/puppeteer/browser.test.ts` (new)
- `app/api/health/route.ts` (new)
- `scripts/load-test.mjs` (new, dev tool - not part of the build)
- `blueprint/project-plan.md` (modified - added `## 8. Deployment`, by explicit user request after this feature's steps)
- `blueprint/context/project-overview.md` (regenerated via `/overview` after the plan edit)

## Data / contracts

- **New env var, load-bearing for deployment:** `CERTIFICATE_RENDER_CONCURRENCY`
  - optional, positive integer, falls back to `2` when unset or invalid.
  Now documented in `project-plan.md` section 8 and `project-overview.md`'s
  Deployment section.
- **New route:** `GET /api/health` -> `{ status: "ok" }`, 200. This is the
  path to configure as Render's health check path. Intentionally has no
  request/response body beyond this - not meant to grow into a deeper
  readiness probe (see **Notes for the AI**). Documented in the same two
  places.

## Testing

`npm run test` (Vitest) is configured, so the test gate is on for
logic-bearing steps:

- Step 1's `parseConcurrency` and the queue's concurrency-enforcing behavior
  (via `withPage`, treated as a black box, `puppeteer.launch` mocked) are
  real logic with real edge cases - both got tests in the new
  `browser.test.ts`. 76/76 tests pass (`npm run test`).
- Steps 2-4 are logging, an HTTP route, and a standalone dev script -
  integration/tooling concerns, exempt per `coding-standards.md`. Verified
  by running them for real: the health route returned a clean 200 in this
  exact dev process while Puppeteer/Chrome was still broken (the scenario
  its decoupling is meant to protect against), and the load-test script
  correctly fired concurrent requests, timed each, and summarized
  pass/fail against the (Puppeteer-broken, so failing) export endpoint -
  proving the script's own mechanics work even though the underlying
  render couldn't succeed locally. The observability log line's exact
  format was confirmed via the Step 1 mocked test suite in verbose mode.

## Notes for the AI

- **Local Puppeteer is currently broken on this machine** (documented in the
  feature 7 and feature 8 archives): the cached Chrome-for-Testing binary
  fails to launch (`Symbol not found:
  _kVTCompressionPropertyKey_ReferenceBufferCount`, a macOS/Chrome-build
  mismatch). Step 1's automated tests mock `puppeteer.launch` entirely and
  are unaffected. Steps 2 and 4's "done when" criteria that need a real
  render couldn't be fully verified end-to-end locally - verified what was
  verifiable (mocked tests, real HTTP calls, real script execution against
  a failing-but-real endpoint) and said plainly what remained unverified,
  rather than claiming a real render was observed when it wasn't. Still
  unresolved as of this feature's completion.
- **Why the health check must not depend on Puppeteer/browser readiness:**
  Chrome's cold start can be slow, and `getBrowser()`'s singleton is lazy
  (first render triggers the launch). If the health check waited on it,
  Render could see a slow or failing health check during normal startup or
  a transient Chrome hiccup and restart an otherwise-healthy service. Keep
  `/api/health` proving only "the Next.js server is responding."
- **Testing the concurrency queue as a black box, not via internals:** don't
  export or reach into `activeRenders`/`waiting` to assert on them directly.
  Drive concurrency entirely through `withPage`'s public behavior (have the
  functions passed to it track their own peak-concurrency via a counter in
  the test) - more robust against internal refactors, and proves the same
  thing a real caller would experience.
- **`globalThis.__certificreateBrowserPromise` is a singleton that persists
  across test cases in the same process.** Reset it to `undefined` in a
  `beforeEach` (or equivalent) so each test gets a fresh mocked browser
  instance, or tests will interfere with each other.
- Keep `scripts/load-test.mjs` a plain standalone script (shebang or
  documented `node scripts/load-test.mjs` invocation) - not a new `package.json`
  script, not wired into `verify`, and no new dependency (use the built-in
  `fetch`).
- **Follow-up completed in this same session, after all four build steps:**
  the user explicitly asked for the deferred `project-plan.md` section 8 +
  `/overview` regeneration, which is why those two files are part of this
  feature's diff despite being called out as out-of-scope build steps above
  - they were a separate, explicitly approved action layered on top, not
  something `/implement` did unprompted.
