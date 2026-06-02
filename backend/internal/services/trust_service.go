package services

import (
	"time"

	"github.com/jmoiron/sqlx"
)

type TrustBreakdown struct {
	Overall           float64 `json:"overall"`
	DonationCount     float64 `json:"donation_count"`     // 30%
	VerificationLevel float64 `json:"verification_level"` // 30%
	ClaimAccuracy     float64 `json:"claim_accuracy"`     // 20%
	ProfileComplete   float64 `json:"profile_complete"`   // 10%
	AccountAge        float64 `json:"account_age"`        // 10%
}

type TrustService struct {
	db *sqlx.DB
}

func NewTrustService(db *sqlx.DB) *TrustService {
	return &TrustService{db: db}
}

func (s *TrustService) GetUserIDByUsername(username string) (string, error) {
	var id string
	err := s.db.Get(&id, "SELECT id FROM users WHERE username = $1", username)
	return id, err
}

func (s *TrustService) GetStoredScore(userID string) (float64, error) {
	var score float64
	err := s.db.Get(&score, "SELECT COALESCE(trust_score, 0) FROM users WHERE id = $1", userID)
	return score, err
}

func (s *TrustService) Calculate(userID string) (*TrustBreakdown, error) {
	var totalDonations int
	_ = s.db.Get(&totalDonations, "SELECT COALESCE(total_donations, 0) FROM users WHERE id = $1", userID)

	var verificationLevel int
	_ = s.db.Get(&verificationLevel, "SELECT COALESCE(verification_level, 0) FROM users WHERE id = $1", userID)

	var totalClaims, approvedClaims int
	_ = s.db.Get(&totalClaims, "SELECT COUNT(*) FROM donation_claims WHERE user_id = $1", userID)
	_ = s.db.Get(&approvedClaims, "SELECT COUNT(*) FROM donation_claims WHERE user_id = $1 AND status = 'approved'", userID)

	var createdAt time.Time
	_ = s.db.Get(&createdAt, "SELECT created_at FROM users WHERE id = $1", userID)

	var fullName, phone, city, bloodType, province string
	_ = s.db.Get(&fullName, "SELECT full_name FROM users WHERE id = $1", userID)
	_ = s.db.Get(&phone, "SELECT phone FROM users WHERE id = $1", userID)
	_ = s.db.Get(&city, "SELECT city FROM users WHERE id = $1", userID)
	_ = s.db.Get(&bloodType, "SELECT blood_type FROM users WHERE id = $1", userID)
	_ = s.db.Get(&province, "SELECT province FROM users WHERE id = $1", userID)

	profileFields := 0
	if fullName != "" { profileFields++ }
	if phone != "" { profileFields++ }
	if city != "" { profileFields++ }
	if bloodType != "" { profileFields++ }
	if province != "" { profileFields++ }
	profileScore := float64(profileFields) / 5.0 * 100.0

	donationScore := float64(totalDonations) / 50.0 * 100.0
	if donationScore > 100 { donationScore = 100 }

	verifScore := float64(verificationLevel) / 3.0 * 100.0

	claimScore := 100.0
	if totalClaims > 0 {
		claimScore = float64(approvedClaims) / float64(totalClaims) * 100.0
	}

	accountAgeDays := time.Since(createdAt).Hours() / 24
	ageScore := accountAgeDays / 730.0 * 100.0
	if ageScore > 100 { ageScore = 100 }

	overall := donationScore*0.30 + verifScore*0.30 + claimScore*0.20 + profileScore*0.10 + ageScore*0.10

	return &TrustBreakdown{
		Overall:           overall,
		DonationCount:     donationScore,
		VerificationLevel: verifScore,
		ClaimAccuracy:     claimScore,
		ProfileComplete:   profileScore,
		AccountAge:        ageScore,
	}, nil
}
