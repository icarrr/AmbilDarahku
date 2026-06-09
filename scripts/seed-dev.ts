import "dotenv/config";
import { pool, seedBadges } from "./migrate";
import bcrypt from "bcryptjs";

const BLOOD_TYPES = ["A", "B", "AB", "O"];
const RHESUS = ["+", "-"];
const CITIES = ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara", "Bandung", "Surabaya", "Yogyakarta", "Denpasar", "Medan"];
const PROVINCES = ["DKI Jakarta", "Jawa Barat", "Jawa Timur", "DI Yogyakarta", "Bali", "Sumatera Utara"];
const DISTRICTS = ["Gambir", "Tanah Abang", "Menteng", "Senayan", "Kebayoran Baru", "Cimahi", "Gubeng", "Gondokusuman"];
const GENDERS = ["male", "female"];
const INSTITUTIONS = ["PMI Pusat", "PMI Jakarta", "PMI Bandung", "RSUD Tarakan", "RSUD Dr. Soetomo", "RS Cipto Mangunkusumo"];

const donorData = [
  { full_name: "Budi Santoso", phone: "6281111111111", email: "budi@example.com", blood_type: "A", rhesus: "+", weight_kg: 70, height_cm: 172, city: "Jakarta Pusat", province: "DKI Jakarta", district: "Menteng", gender: "male", total_donations: 12 },
  { full_name: "Siti Rahmawati", phone: "6282222222222", email: "siti@example.com", blood_type: "O", rhesus: "+", weight_kg: 58, height_cm: 160, city: "Bandung", province: "Jawa Barat", district: "Cimahi", gender: "female", total_donations: 8 },
  { full_name: "Ahmad Hidayat", phone: "6283333333333", email: "ahmad@example.com", blood_type: "B", rhesus: "-", weight_kg: 75, height_cm: 175, city: "Surabaya", province: "Jawa Timur", district: "Gubeng", gender: "male", total_donations: 25 },
  { full_name: "Dewi Lestari", phone: "6284444444444", email: "dewi@example.com", blood_type: "AB", rhesus: "+", weight_kg: 55, height_cm: 158, city: "Yogyakarta", province: "DI Yogyakarta", district: "Gondokusuman", gender: "female", total_donations: 5 },
  { full_name: "Rudi Hartono", phone: "6285555555555", email: "rudi@example.com", blood_type: "O", rhesus: "-", weight_kg: 80, height_cm: 180, city: "Denpasar", province: "Bali", district: "Menteng", gender: "male", total_donations: 3 },
  { full_name: "Rina Wijaya", phone: "6286666666666", email: "rina@example.com", blood_type: "A", rhesus: "+", weight_kg: 52, height_cm: 155, city: "Medan", province: "Sumatera Utara", district: "Gambir", gender: "female", total_donations: 15 },
  { full_name: "Hendra Gunawan", phone: "6287777777777", email: "hendra@example.com", blood_type: "B", rhesus: "+", weight_kg: 68, height_cm: 168, city: "Jakarta Selatan", province: "DKI Jakarta", district: "Kebayoran Baru", gender: "male", total_donations: 7 },
  { full_name: "Fitri Handayani", phone: "6288888888888", email: "fitri@example.com", blood_type: "AB", rhesus: "-", weight_kg: 60, height_cm: 163, city: "Jakarta Barat", province: "DKI Jakarta", district: "Tanah Abang", gender: "female", total_donations: 10 },
];

async function seedDev() {
  const hash = await bcrypt.hash("donor123", 12);
  const userIds: string[] = [];

  for (const d of donorData) {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [d.email]);
    if (existing.rows.length > 0) {
      console.log(`user ${d.email} already exists, skipping`);
      userIds.push(existing.rows[0].id);
      continue;
    }

    const username = d.email.split("@")[0];
    const lat = -6.2 + Math.random() * 0.4;
    const lng = 106.8 + Math.random() * 0.3;
    const volumePerBag = d.weight_kg <= 55 ? 0.35 : 0.45;
    const totalVolume = +(d.total_donations * volumePerBag).toFixed(2);
    const points = d.total_donations * 10;

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, phone, email, password_hash, role, date_of_birth, gender, blood_type, rhesus, weight_kg, height_cm, province, city, district, latitude, longitude, username, total_donations, total_points, donation_volume_total, eligibility_status, availability_status, email_verified, trust_score, verification_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
       RETURNING id`,
      [
        d.full_name, d.phone, d.email, hash, "donor",
        `198${Math.floor(Math.random() * 9)}-0${Math.floor(Math.random() * 9) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
        d.gender, d.blood_type, d.rhesus, d.weight_kg, d.height_cm,
        d.province, d.city, d.district, lat, lng,
        username, d.total_donations, points, totalVolume,
        d.total_donations >= 3 ? "eligible" : "eligible",
        "available", true, Math.min(50 + d.total_donations * 3, 100),
        d.total_donations >= 10 ? 2 : d.total_donations >= 5 ? 1 : 0,
      ]
    );
    userIds.push(rows[0].id);
    console.log(`donor ${d.full_name} seeded (${d.blood_type}${d.rhesus}, ${d.total_donations} donations)`);
  }

  await seedBadges();

  const { rows: allBadges } = await pool.query("SELECT id, min_donations FROM badges ORDER BY min_donations");
  for (let i = 0; i < userIds.length; i++) {
    const donor = donorData[i];
    const earnedBadges = allBadges.filter((b: any) => donor.total_donations >= b.min_donations);
    for (const badge of earnedBadges) {
      await pool.query(
        `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userIds[i], badge.id]
      );
    }
    if (earnedBadges.length > 0) {
      console.log(`  ${donor.full_name}: ${earnedBadges.length} badges awarded`);
    }
  }

  const events = [
    { title: "Donor Darah PMI Jakarta", description: "Ayo donor darah bersama PMI Jakarta Pusat.", location: "Gedung PMI Jakarta Pusat", city: "Jakarta Pusat", event_date: "2026-07-15", start_time: "08:00", end_time: "14:00", organizer: "PMI Jakarta Pusat", contact_phone: "6281111111110", quota: 100 },
    { title: "Blood Donation Drive - Bandung", description: "Donor darah massal di Bandung.", location: "Alun-alun Bandung", city: "Bandung", event_date: "2026-07-20", start_time: "09:00", end_time: "15:00", organizer: "PMI Bandung", contact_phone: "6282222222220", quota: 75 },
    { title: "Surabaya Donor Day", description: "Mari berbagi, setetes darah berarti bagi sesama.", location: "Taman Suroboyo", city: "Surabaya", event_date: "2026-08-05", start_time: "07:00", end_time: "13:00", organizer: "PMI Surabaya", contact_phone: "6283333333330", quota: 50 },
  ];

  for (const e of events) {
    const existing = await pool.query("SELECT id FROM events WHERE title = $1", [e.title]);
    if (existing.rows.length > 0) {
      console.log(`event "${e.title}" already exists, skipping`);
      continue;
    }
    await pool.query(
      `INSERT INTO events (title, description, location, city, event_date, start_time, end_time, organizer, contact_phone, quota, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [e.title, e.description, e.location, e.city, e.event_date, e.start_time, e.end_time, e.organizer, e.contact_phone, e.quota, "upcoming"]
    );
    console.log(`event "${e.title}" seeded`);
  }

  const bloodRequests = [
    { patient: "Ani S", hospital: "RSUD Tarakan", blood_type: "A", rhesus: "+", bags: 3, urgency: "urgent", city: "Jakarta Pusat", contact: "6281111111112", notes: "Pasien kecelakaan" },
    { patient: "Bambang P", hospital: "RS Cipto Mangunkusumo", blood_type: "O", rhesus: "-", bags: 5, urgency: "critical", city: "Jakarta Pusat", contact: "6282222222223", notes: "Operasi jantung" },
    { patient: "Citra D", hospital: "RS Hasan Sadikin", blood_type: "B", rhesus: "+", bags: 2, urgency: "normal", city: "Bandung", contact: "6283333333334", notes: "Persalinan" },
  ];

  if (userIds.length > 0) {
    for (const r of bloodRequests) {
      const existing = await pool.query("SELECT id FROM blood_requests WHERE patient_name = $1 AND hospital = $2", [r.patient, r.hospital]);
      if (existing.rows.length > 0) {
        console.log(`request for ${r.patient} already exists, skipping`);
        continue;
      }
      await pool.query(
        `INSERT INTO blood_requests (requester_id, patient_name, hospital, blood_type, rhesus, bags, urgency, latitude, longitude, city, contact_phone, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [userIds[0], r.patient, r.hospital, r.blood_type, r.rhesus, r.bags, r.urgency, -6.2, 106.8, r.city, r.contact, r.notes, "open"]
      );
      console.log(`request for ${r.patient} (${r.blood_type}${r.rhesus}) seeded`);
    }
  }

  console.log("dev seed complete — donors, events, and blood requests created");
}

seedDev()
  .then(() => pool.end())
  .catch((err) => {
    console.error("seed-dev failed:", err);
    process.exit(1);
  });
