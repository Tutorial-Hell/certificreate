#!/usr/bin/env node
// Fires concurrent POST requests at a certificate export endpoint - a way to
// generate the "real renders" needed to manually check instance sizing and
// render-queue behavior against a deployed (or local) server.
//
// Usage:
//   node scripts/load-test.mjs <url> <concurrency>
//   node scripts/load-test.mjs http://localhost:3000/api/certificate/png 5
//   node scripts/load-test.mjs https://certificreate.onrender.com/api/certificate/pdf 3

const [, , url, concurrencyArg] = process.argv;
const concurrency = Number(concurrencyArg) || 1;

if (!url) {
  console.error("Usage: node scripts/load-test.mjs <url> <concurrency>");
  process.exit(1);
}

const samplePayload = {
  recipientName: "Load Test",
  course: "Load Test Course",
  date: "2026-08-09",
  instructorName: "Load Test Instructor",
  templateId: "black-border",
};

async function fireRequest(id) {
  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(samplePayload),
    });
    await response.arrayBuffer(); // drain the body before timing ends
    const durationMs = Math.round(performance.now() - start);
    console.log(`#${id} ${response.ok ? "OK" : "FAIL"} ${response.status} ${durationMs}ms`);
    return { ok: response.ok, durationMs };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    const message = error instanceof Error ? error.message : String(error);
    console.log(`#${id} ERROR ${durationMs}ms ${message}`);
    return { ok: false, durationMs };
  }
}

const results = await Promise.all(
  Array.from({ length: concurrency }, (_, i) => fireRequest(i + 1)),
);

const succeeded = results.filter((r) => r.ok).length;
const durations = results.map((r) => r.durationMs);
const avgMs = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
const maxMs = Math.max(...durations);

console.log("---");
console.log(`${succeeded}/${concurrency} succeeded, avg ${avgMs}ms, max ${maxMs}ms`);

if (succeeded < concurrency) process.exitCode = 1;
