import "dotenv/config";
import { Pool } from "pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || "postgres"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "ambildarahku"}`,
  ssl: process.env.DB_SSLMODE === "disable" ? false : { rejectUnauthorized: false },
});

const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'donor',
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  blood_type VARCHAR(3) NOT NULL,
  rhesus VARCHAR(5) NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  height_cm DECIMAL(5,2) NOT NULL,
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL DEFAULT 0,
  longitude DECIMAL(10,7) NOT NULL DEFAULT 0,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  availability_mode VARCHAR(10) NOT NULL DEFAULT 'automatic',
  availability_status VARCHAR(25) NOT NULL DEFAULT 'available',
  ready_again_date DATE,
  unavailable_reason TEXT,
  total_donations INT NOT NULL DEFAULT 0,
  last_donation_date DATE,
  eligibility_status VARCHAR(16) NOT NULL DEFAULT 'eligible',
  total_points INT NOT NULL DEFAULT 0,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  national_donor_id VARCHAR(20) UNIQUE,
  donation_volume_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  verification_level INT NOT NULL DEFAULT 0,
  trust_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_blood_type ON users(blood_type);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_eligibility ON users(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_users_availability ON users(availability_status);
CREATE INDEX IF NOT EXISTS idx_users_coords ON users(latitude, longitude);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS nik VARCHAR(16) UNIQUE;

CREATE TABLE IF NOT EXISTS donor_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donation_date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  bags INT NOT NULL DEFAULT 1,
  notes TEXT,
  proof_photo TEXT,
  proof_card TEXT,
  proof_letter TEXT,
  verification_status VARCHAR(10) NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  claim_id UUID,
  verification_level VARCHAR(20) DEFAULT 'self',
  verification_source VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donor_histories_user ON donor_histories(user_id);

CREATE TABLE IF NOT EXISTS donor_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending',
  verifier_id UUID REFERENCES users(id),
  verifier_role VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donor_verifications_user ON donor_verifications(user_id);

CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_name VARCHAR(150) NOT NULL,
  hospital VARCHAR(255) NOT NULL,
  blood_type VARCHAR(3) NOT NULL,
  rhesus VARCHAR(5) NOT NULL,
  bags INT NOT NULL,
  fulfilled_bags INT NOT NULL DEFAULT 0,
  urgency VARCHAR(10) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL DEFAULT 0,
  longitude DECIMAL(10,7) NOT NULL DEFAULT 0,
  city VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  notes TEXT,
  status VARCHAR(15) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_type ON blood_requests(blood_type);
CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);

CREATE TABLE IF NOT EXISTS request_fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bags INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_fulfillments_request ON request_fulfillments(request_id);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  min_donations INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  organizer VARCHAR(255),
  contact_phone VARCHAR(20),
  quota INT NOT NULL DEFAULT 0,
  banner_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE TABLE IF NOT EXISTS donor_passports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  passport_number VARCHAR(20) UNIQUE NOT NULL,
  qr_token VARCHAR(64) UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_renewed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donor_passports_user ON donor_passports(user_id);
CREATE INDEX IF NOT EXISTS idx_donor_passports_qr ON donor_passports(qr_token);

CREATE TABLE IF NOT EXISTS donation_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donation_date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  institution_name VARCHAR(255) NOT NULL DEFAULT '',
  blood_type VARCHAR(3) NOT NULL DEFAULT '',
  volume_ml INTEGER NOT NULL DEFAULT 350,
  proof_photo_url TEXT,
  proof_document_url TEXT,
  additional_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_claims_user ON donation_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_claims_status ON donation_claims(status);

CREATE TABLE IF NOT EXISTS award_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  award_type VARCHAR(20) NOT NULL DEFAULT 'title',
  criteria JSONB NOT NULL DEFAULT '{}',
  scope VARCHAR(20) NOT NULL DEFAULT 'national',
  scope_value VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'auto',
  config_id UUID REFERENCES award_configs(id),
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_titles_user ON user_titles(user_id);
`;

const enableRls = `
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donor_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS request_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donor_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donation_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS award_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_titles ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
`;

export async function seedBadges() {
  const badges = [
    { name: "First Drop", description: "Donor perdana", icon_url: "/badges/first-drop.svg", min_donations: 1 },
    { name: "Lifesaver", description: "5 kali donor", icon_url: "/badges/lifesaver.svg", min_donations: 5 },
    { name: "Hero", description: "10 kali donor", icon_url: "/badges/hero.svg", min_donations: 10 },
    { name: "Guardian", description: "25 kali donor", icon_url: "/badges/guardian.svg", min_donations: 25 },
    { name: "Legend", description: "50 kali donor", icon_url: "/badges/legend.svg", min_donations: 50 },
    { name: "Blood Champion", description: "100 kali donor", icon_url: "/badges/champion.svg", min_donations: 100 },
  ];

  for (const b of badges) {
    await pool.query(
      `INSERT INTO badges (name, description, icon_url, min_donations)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO NOTHING`,
      [b.name, b.description, b.icon_url, b.min_donations]
    );
  }
  console.log("badges seeded");
}

export async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  if (!email) {
    console.log("SEED_ADMIN_EMAIL not set, skipping admin seed");
    return;
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    console.log("admin user already exists, skipping");
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 12);
  const phone = process.env.SEED_ADMIN_PHONE || "6280000000000";

  await pool.query(
    `INSERT INTO users (full_name, phone, email, password_hash, role, date_of_birth, gender, blood_type, rhesus, weight_kg, height_cm, province, city, district, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    ["Admin AmbilDarahku", phone, email, hash, "super_admin", "1990-01-01", "male", "O", "+", 70, 170, "DKI Jakarta", "Jakarta Pusat", "Gambir", true]
  );
  console.log("admin user seeded");
}

export async function migrate() {
  console.log("running migrations...");
  await pool.query(schema);
  console.log("schema migrations completed");

  await pool.query(enableRls);
  console.log("row-level security enabled on all tables (no policies — service_role bypasses RLS, anon key is unused)");

  await seedBadges();
  await seedAdmin();
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  migrate()
    .then(() => pool.end())
    .then(() => console.log("migrations complete"))
    .catch((err) => {
      console.error("migration failed:", err);
      process.exit(1);
    });
}
