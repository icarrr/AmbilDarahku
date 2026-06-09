export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  password_hash: string;
  role: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  rhesus: string;
  weight_kg: number;
  height_cm: number;
  province: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  username: string | null;
  avatar_url: string | null;
  availability_mode: string;
  availability_status: string;
  ready_again_date: string | null;
  unavailable_reason: string | null;
  total_donations: number;
  last_donation_date: string | null;
  eligibility_status: string;
  total_points: number;
  email_verified: boolean;
  national_donor_id: string | null;
  donation_volume_total: number;
  verification_level: number;
  trust_score: number;
  created_at: string;
  updated_at: string;
}

export interface DonorHistory {
  id: string;
  user_id: string;
  donation_date: string;
  location: string;
  institution: string;
  bags: number;
  notes: string | null;
  proof_photo: string | null;
  proof_card: string | null;
  proof_letter: string | null;
  verification_status: string;
  verified_by: string | null;
  verified_at: string | null;
  claim_id: string | null;
  verification_level: string;
  verification_source: string;
  created_at: string;
}

export interface DonorVerification {
  id: string;
  user_id: string;
  level: number;
  status: string;
  verifier_id: string | null;
  verifier_role: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BloodRequest {
  id: string;
  requester_id: string;
  patient_name: string;
  hospital: string;
  blood_type: string;
  rhesus: string;
  bags: number;
  fulfilled_bags: number;
  urgency: string;
  latitude: number;
  longitude: number;
  city: string;
  contact_phone: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RequestFulfillment {
  id: string;
  request_id: string;
  donor_id: string;
  bags: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  min_donations: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge_name?: string;
  badge_icon_url?: string;
  badge_description?: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface VerificationToken {
  id: string;
  user_id: string;
  token: string;
  type: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string;
  city: string;
  event_date: string;
  start_time: string;
  end_time: string;
  organizer: string;
  contact_phone: string;
  quota: number;
  banner_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DonorPassport {
  id: string;
  user_id: string;
  passport_number: string;
  qr_token: string;
  issued_at: string;
  last_renewed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DonationClaim {
  id: string;
  user_id: string;
  donation_date: string;
  location: string;
  institution_name: string;
  blood_type: string;
  volume_ml: number;
  proof_photo_url: string | null;
  proof_document_url: string | null;
  additional_notes: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AwardConfig {
  id: string;
  name: string;
  description: string;
  award_type: string;
  criteria: any;
  scope: string;
  scope_value: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTitle {
  id: string;
  user_id: string;
  title: string;
  awarded_at: string;
  source: string;
  config_id: string | null;
  description: string | null;
  created_at: string;
}
