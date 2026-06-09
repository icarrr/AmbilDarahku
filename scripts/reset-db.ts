import "dotenv/config";
import { pool, migrate, seedBadges, seedAdmin } from "./migrate";

const dropAll = `
DROP TABLE IF EXISTS
  user_badges,
  user_titles,
  donor_histories,
  donor_verifications,
  donor_passports,
  donation_claims,
  request_fulfillments,
  blood_requests,
  verification_tokens,
  refresh_tokens,
  events,
  award_configs,
  badges,
  users
CASCADE;
`;

async function reset() {
  console.log("dropping all tables...");
  await pool.query(dropAll);
  console.log("all tables dropped");

  await migrate();
  console.log("reset complete — clean production-ready state");

  await pool.end();
}

reset().catch((err) => {
  console.error("reset failed:", err);
  process.exit(1);
});
