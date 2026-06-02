package database

import (
	"log"

	"github.com/jmoiron/sqlx"
)

func RunMigrations(db *sqlx.DB) {
	schema := `
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		full_name VARCHAR(150) NOT NULL,
		phone VARCHAR(20) NOT NULL UNIQUE,
		email VARCHAR(150) NOT NULL UNIQUE,
		password_hash VARCHAR(255) NOT NULL,
		role VARCHAR(20) NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'super_admin', 'community_admin', 'pmi_admin', 'hospital_admin')),
		date_of_birth DATE NOT NULL,
		gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
		blood_type VARCHAR(3) NOT NULL CHECK (blood_type IN ('A', 'B', 'AB', 'O')),
		rhesus VARCHAR(5) NOT NULL CHECK (rhesus IN ('+', '-')),
		weight_kg DECIMAL(5,2) NOT NULL,
		height_cm DECIMAL(5,2) NOT NULL,
		province VARCHAR(100) NOT NULL,
		city VARCHAR(100) NOT NULL,
		district VARCHAR(100) NOT NULL,
		latitude DECIMAL(10,7) NOT NULL,
		longitude DECIMAL(10,7) NOT NULL,
		username VARCHAR(50) UNIQUE,
		avatar_url TEXT,
		availability_mode VARCHAR(10) NOT NULL DEFAULT 'automatic' CHECK (availability_mode IN ('automatic', 'manual')),
		availability_status VARCHAR(25) NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'temporarily_unavailable', 'permanently_unavailable')),
		ready_again_date DATE,
		unavailable_reason TEXT,
		total_donations INT NOT NULL DEFAULT 0,
		last_donation_date DATE,
		eligibility_status VARCHAR(16) NOT NULL DEFAULT 'eligible' CHECK (eligibility_status IN ('eligible', 'not_eligible', 'waiting_period', 'needs_clearance')),
		total_points INT NOT NULL DEFAULT 0,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_users_blood_type ON users(blood_type);
	CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
	CREATE INDEX IF NOT EXISTS idx_users_eligibility ON users(eligibility_status);
	CREATE INDEX IF NOT EXISTS idx_users_availability ON users(availability_status);
	CREATE INDEX IF NOT EXISTS idx_users_coords ON users(latitude, longitude);

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
		verification_status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
		verified_by UUID REFERENCES users(id),
		verified_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_donor_histories_user ON donor_histories(user_id);

	CREATE TABLE IF NOT EXISTS donor_verifications (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		level INT NOT NULL CHECK (level IN (1, 2, 3)),
		status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
		verifier_id UUID REFERENCES users(id),
		verifier_role VARCHAR(20) NOT NULL CHECK (verifier_role IN ('community', 'pmi')),
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
		blood_type VARCHAR(3) NOT NULL CHECK (blood_type IN ('A', 'B', 'AB', 'O')),
		rhesus VARCHAR(5) NOT NULL CHECK (rhesus IN ('+', '-')),
		bags INT NOT NULL,
		fulfilled_bags INT NOT NULL DEFAULT 0,
		urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('critical', 'urgent', 'normal')),
		latitude DECIMAL(10,7) NOT NULL,
		longitude DECIMAL(10,7) NOT NULL,
		city VARCHAR(100) NOT NULL,
		contact_phone VARCHAR(20) NOT NULL,
		notes TEXT,
		status VARCHAR(15) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'cancelled')),
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
		status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
	CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

	ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS fulfilled_bags INT NOT NULL DEFAULT 0;

	ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

	UPDATE users SET eligibility_status = 'waiting_period' WHERE eligibility_status = 'recovery';
	ALTER TABLE users DROP CONSTRAINT IF EXISTS users_eligibility_status_check;
	ALTER TABLE users ADD CONSTRAINT users_eligibility_status_check
		CHECK (eligibility_status IN ('eligible', 'not_eligible', 'waiting_period', 'needs_clearance'));
	ALTER TABLE users ALTER COLUMN eligibility_status TYPE VARCHAR(16);

	CREATE TABLE IF NOT EXISTS verification_tokens (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		token VARCHAR(255) NOT NULL,
		type VARCHAR(20) NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
		expires_at TIMESTAMPTZ NOT NULL,
		used_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
	CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON verification_tokens(user_id);

	ALTER TABLE users ADD COLUMN IF NOT EXISTS national_donor_id VARCHAR(20) UNIQUE;
	ALTER TABLE users ADD COLUMN IF NOT EXISTS donation_volume_total DECIMAL(10,2) NOT NULL DEFAULT 0;

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
		status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
		reviewed_by UUID REFERENCES users(id),
		reviewed_at TIMESTAMPTZ,
		rejection_reason TEXT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_donation_claims_user ON donation_claims(user_id);
	CREATE INDEX IF NOT EXISTS idx_donation_claims_status ON donation_claims(status);

	ALTER TABLE donor_histories ADD COLUMN IF NOT EXISTS claim_id UUID REFERENCES donation_claims(id);
	ALTER TABLE donor_histories ADD COLUMN IF NOT EXISTS verification_level VARCHAR(20) DEFAULT 'self' CHECK (verification_level IN ('self', 'community', 'organizer', 'hospital', 'pmi'));
	ALTER TABLE donor_histories ADD COLUMN IF NOT EXISTS verification_source VARCHAR(100);
	ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_level INT NOT NULL DEFAULT 0;

	ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) NOT NULL DEFAULT 0;

	ALTER TABLE users ALTER COLUMN latitude SET DEFAULT 0;
	ALTER TABLE users ALTER COLUMN longitude SET DEFAULT 0;

	CREATE TABLE IF NOT EXISTS award_configs (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(100) NOT NULL,
		description TEXT,
		award_type VARCHAR(20) NOT NULL DEFAULT 'title' CHECK (award_type IN ('badge', 'title', 'certificate')),
		criteria JSONB NOT NULL DEFAULT '{}',
		scope VARCHAR(20) NOT NULL DEFAULT 'national' CHECK (scope IN ('national', 'regional', 'city')),
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
	`

	_, err := db.Exec(schema)
	if err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	log.Println("database migrations completed")
}
