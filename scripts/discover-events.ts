import "dotenv/config";
import { discoverEvents } from "../src/lib/event-discovery/runner";

async function main() {
  console.log("=== Event Discovery CLI ===\n");
  const result = await discoverEvents();

  console.log(`\n=== Done in ${(result.durationMs / 1000).toFixed(1)}s ===`);
  console.log(`Sources: ${result.totalSources}`);
  console.log(`Found:   ${result.totalScraped}`);
  console.log(`New:     ${result.totalNew}`);
  console.log(`Errors:  ${result.totalErrors}`);
  console.log(`Archived: ${result.archivedCount}`);
}

main().catch((err) => {
  console.error("discovery failed:", err);
  process.exit(1);
});
