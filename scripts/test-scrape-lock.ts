import "dotenv/config";
import assert from "assert";
import { createPool, tryAcquireScrapeLock, releaseScrapeLock } from "../src/lib/discovery/scheduler";

// Self-check for the scrape lock (concurrency guard).
// Requires schema from `npm run migrate`. Uses only the test-lock row,
// never touches application data.
const JOB = "test_lock";

async function main() {
  const pool = createPool();

  assert.strictEqual(
    await tryAcquireScrapeLock(pool, JOB),
    true,
    "first acquire should win"
  );

  assert.strictEqual(
    await tryAcquireScrapeLock(pool, JOB),
    false,
    "second acquire while RUNNING should be refused (no duplicate job)"
  );

  await releaseScrapeLock(pool, JOB);
  assert.strictEqual(
    await tryAcquireScrapeLock(pool, JOB),
    true,
    "acquire after release should win"
  );

  // Stale lock recovery: force expired locked_until, acquire must succeed
  await pool.query(
    `UPDATE scrape_jobs SET locked_until = NOW() - interval '1 hour' WHERE job_name = $1`,
    [JOB]
  );
  assert.strictEqual(
    await tryAcquireScrapeLock(pool, JOB),
    true,
    "stale lock should be recoverable"
  );

  await releaseScrapeLock(pool, JOB);
  await pool.query(`DELETE FROM scrape_jobs WHERE job_name = $1`, [JOB]);
  await pool.end();

  console.log("PASS: lock acquire/refuse/release/stale-recovery");
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});