package seed

import (
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/pkg/utils"
	"github.com/jmoiron/sqlx"
)

func SeedDummy(db *sqlx.DB) {
	userRepo := repositories.NewUserRepository(db)
	badgeRepo := repositories.NewBadgeRepository(db)
	requestRepo := repositories.NewBloodRequestRepository(db)
	historyRepo := repositories.NewDonorHistoryRepository(db)

	log.Println("seeding dummy data...")

	badges, err := badgeRepo.FindAll()
	if err != nil || len(badges) == 0 {
		log.Printf("warning: no badges found, skipping badge assignment")
		badges = nil
	}

	type cityInfo struct {
		city     string
		province string
		district string
		lat      float64
		lng      float64
	}

	cities := []cityInfo{
		{"Jakarta", "DKI Jakarta", "Jakarta Pusat", -6.2088, 106.8456},
		{"Jakarta", "DKI Jakarta", "Jakarta Selatan", -6.2615, 106.8104},
		{"Jakarta", "DKI Jakarta", "Jakarta Timur", -6.2250, 106.9000},
		{"Bandung", "Jawa Barat", "Bandung Kota", -6.9175, 107.6191},
		{"Surabaya", "Jawa Timur", "Surabaya Kota", -7.2575, 112.7521},
		{"Yogyakarta", "DI Yogyakarta", "Yogyakarta Kota", -7.7956, 110.3695},
		{"Medan", "Sumatera Utara", "Medan Kota", 3.5952, 98.6722},
		{"Makassar", "Sulawesi Selatan", "Makassar Kota", -5.1477, 119.4327},
		{"Semarang", "Jawa Tengah", "Semarang Kota", -6.9932, 110.4203},
		{"Denpasar", "Bali", "Denpasar Kota", -8.6705, 115.2126},
		{"Palembang", "Sumatera Selatan", "Palembang Kota", -2.9761, 104.7754},
		{"Manado", "Sulawesi Utara", "Manado Kota", 1.4748, 124.8421},
		{"Banjarmasin", "Kalimantan Selatan", "Banjarmasin Kota", -3.3186, 114.5944},
		{"Padang", "Sumatera Barat", "Padang Kota", -0.9471, 100.4172},
		{"Pontianak", "Kalimantan Barat", "Pontianak Kota", -0.0220, 109.3425},
	}

	type donorData struct {
		fullName       string
		email          string
		phone          string
		bloodType      string
		rhesus         string
		gender         string
		weight         float64
		height         float64
		donations      int
		username       string
		availability   string
		eligibility    string
		lastDonation   string
		totalPoints    int
	}

	dummyDonors := []donorData{
		{"Budi Santoso", "budi@example.com", "6281281111111", "O", "+", "male", 72, 172, 12, "budi.santoso", "available", "waiting_period", "2026-04-15", 120},
		{"Siti Rahmawati", "siti@example.com", "6281381111112", "A", "+", "female", 55, 160, 8, "siti.rahmawati", "available", "eligible", "2026-03-20", 80},
		{"Ahmad Hidayat", "ahmad@example.com", "6281581111113", "B", "+", "male", 68, 170, 3, "ahmad.hidayat", "temporarily_unavailable", "waiting_period", "2026-05-10", 30},
		{"Dewi Lestari", "dewi@example.com", "6285681111114", "AB", "+", "female", 58, 162, 25, "dewi.lestari", "available", "waiting_period", "2026-04-28", 250},
		{"Rizky Pratama", "rizky@example.com", "6287781111115", "O", "+", "male", 75, 178, 1, "rizky.pratama", "available", "waiting_period", "2026-05-25", 10},
		{"Rina Wijaya", "rina@example.com", "6285881111116", "A", "+", "female", 52, 158, 50, "rina.wijaya", "available", "eligible", "2026-03-05", 500},
		{"Hendra Gunawan", "hendra@example.com", "6281981111117", "O", "-", "male", 80, 175, 0, "hendra.gunawan", "available", "eligible", "", 0},
		{"Maya Anggraini", "maya@example.com", "6281781111118", "B", "+", "female", 60, 165, 6, "maya.anggraini", "temporarily_unavailable", "waiting_period", "2026-05-12", 60},
		{"Adi Saputra", "adi@example.com", "6281281111119", "AB", "+", "male", 70, 168, 15, "adi.saputra", "available", "waiting_period", "2026-04-10", 150},
		{"Fitri Handayani", "fitri@example.com", "6282281111120", "A", "-", "female", 57, 163, 2, "fitri.handayani", "available", "waiting_period", "2026-05-28", 20},
		{"Doni Permana", "doni@example.com", "6285281111121", "A", "+", "male", 73, 171, 30, "doni.permana", "available", "eligible", "2026-02-18", 300},
		{"Nurul Aisyah", "nurul@example.com", "6285381111122", "B", "-", "female", 54, 156, 5, "nurul.aisyah", "available", "waiting_period", "2026-04-22", 50},
		{"Eko Prasetyo", "eko@example.com", "6285581111123", "AB", "-", "male", 69, 173, 7, "eko.prasetyo", "permanently_unavailable", "eligible", "2025-12-01", 70},
		{"Ani Wulandari", "ani@example.com", "6285781111124", "O", "+", "female", 62, 164, 10, "ani.wulandari", "available", "waiting_period", "2026-04-30", 100},
		{"Fajar Ramadhan", "fajar@example.com", "6287781111125", "O", "+", "male", 77, 180, 0, "fajar.ramadhan", "available", "eligible", "", 0},
		{"Indah Permata", "indah@example.com", "6289581111126", "A", "+", "female", 50, 155, 4, "indah.permata", "available", "waiting_period", "2026-05-08", 40},
		{"Gilang Firmansyah", "gilang@example.com", "6281281111127", "O", "-", "male", 71, 169, 20, "gilang.f", "available", "eligible", "2026-03-15", 200},
		{"Putri Ayu", "putri@example.com", "6289781111128", "B", "+", "female", 56, 161, 1, "putri.ayu", "available", "waiting_period", "2026-04-05", 10},
		{"Bayu Nugroho", "bayu@example.com", "6281381111129", "O", "+", "male", 65, 174, 35, "bayu.nugroho", "available", "eligible", "2026-01-20", 350},
		{"Sri Wahyuni", "sri@example.com", "6281581111130", "A", "+", "female", 59, 160, 18, "sri.wahyuni", "available", "waiting_period", "2026-04-12", 180},
		{"Dimas Ardiansyah", "dimas@example.com", "6287881111131", "O", "+", "male", 74, 176, 45, "dimas.ard", "available", "eligible", "2026-02-10", 450},
		{"Ratna Sari Dewi", "ratna@example.com", "6289681111132", "O", "-", "female", 53, 157, 9, "ratnasari", "available", "waiting_period", "2026-05-02", 90},
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	commonPassword := "donor123"
	hash, err := utils.HashPassword(commonPassword)
	if err != nil {
		log.Printf("warning: failed to hash password: %v", err)
		return
	}

	var createdUsers []*models.User

	for i, d := range dummyDonors {
		city := cities[i%len(cities)]
		dob := time.Date(rng.Intn(20)+1975, time.Month(rng.Intn(12)+1), rng.Intn(28)+1, 0, 0, 0, 0, time.UTC)
		user := &models.User{
			FullName:           d.fullName,
			Phone:              d.phone,
			Email:              d.email,
			PasswordHash:       hash,
			Role:               "donor",
			DateOfBirth:        dob,
			Gender:             d.gender,
			BloodType:          d.bloodType,
			Rhesus:             d.rhesus,
			WeightKg:           d.weight,
			HeightCm:           d.height,
			Province:           city.province,
			City:               city.city,
			District:           city.district,
			Latitude:           city.lat + (rng.Float64()-0.5)*0.05,
			Longitude:          city.lng + (rng.Float64()-0.5)*0.05,
			AvailabilityMode:   "automatic",
			AvailabilityStatus: d.availability,
			EligibilityStatus:  d.eligibility,
			TotalPoints:        d.totalPoints,
			EmailVerified:      true,
		}

		if d.username != "" {
			user.Username = &d.username
		}

		if d.donations > 0 {
			user.TotalDonations = d.donations
		}

		if d.lastDonation != "" {
			t, err := time.Parse("2006-01-02", d.lastDonation)
			if err == nil {
				user.LastDonationDate = &t
			}
		}

		err := userRepo.Create(user)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique") {
				continue
			}
			log.Printf("warning: failed to create user %s: %v", d.email, err)
			continue
		}

		_, err = db.Exec(`
			UPDATE users SET
				total_donations = $2, total_points = $3, availability_mode = $4,
				availability_status = $5, eligibility_status = $6, last_donation_date = $7
			WHERE id = $1`,
			user.ID, user.TotalDonations, user.TotalPoints, user.AvailabilityMode,
			user.AvailabilityStatus, user.EligibilityStatus, user.LastDonationDate)
		if err != nil {
			log.Printf("warning: failed to update donor stats for %s: %v", d.email, err)
		}

		createdUsers = append(createdUsers, user)
		log.Printf("created donor: %s (%s, %s%s, %s)", user.FullName, user.City, user.BloodType, user.Rhesus, user.Email)
	}

	events := []struct {
		title       string
		location    string
		city        string
		eventDate   string
		startTime   string
		endTime     string
		organizer   string
		contact     string
		quota       int
		status      string
		description string
	}{
		{"Donor Darah Peringatan Hari Darah Sedunia", "RSUD Dr. Soetomo", "Surabaya", "2026-06-14", "08:00", "16:00", "PMI Jawa Timur", "6281288888801", 200, "upcoming", "Donor darah massal dalam rangka Hari Donor Darah Sedunia. Ayo donor dan selamatkan nyawa! Terbuka untuk umum dengan syarat sehat jasmani."},
		{"Bhakti Sosial Kesehatan Jakarta", "Balai Kota Jakarta Pusat", "Jakarta", "2026-06-24", "08:00", "14:00", "PMI DKI Jakarta", "6281288888802", 100, "upcoming", "Kegiatan bakti sosial donor darah yang diselenggarakan oleh PMI DKI Jakarta bekerja sama dengan Pemerintah Provinsi DKI Jakarta."},
		{"Donor Darah RS Harapan Kita", "RS Harapan Kita, Slipi", "Jakarta", "2026-06-27", "09:00", "15:00", "RS Harapan Kita", "6281288888803", 75, "upcoming", "Donor darah rutin bulanan di RS Harapan Kita. Tersedia layanan konsultasi kesehatan gratis bagi pendonor."},
		{"Donor Darah Bulanan", "RS Santosa Bandung", "Bandung", "2026-06-20", "08:00", "14:00", "RS Santosa", "6281288888804", 60, "upcoming", "Donor darah bulanan di RS Santosa Bandung. Setiap pendonor mendapat snack dan vitamin gratis."},
		{"Gerakan Donor Darah Kampus", "Universitas Gadjah Mada", "Yogyakarta", "2026-07-10", "09:00", "15:00", "UGM & PMI Sleman", "6281288888805", 150, "upcoming", "Gerakan donor darah mahasiswa UGM dalam rangka Dies Natalis ke-77. Terbuka untuk mahasiswa dan masyarakat umum."},
		{"Donor Darah Komunitas", "Mall Grand Indonesia", "Jakarta", "2026-07-05", "10:00", "17:00", "AmbilDarahku Community", "6281288888806", 80, "upcoming", "Event donor darah komunitas AmbilDarahku. Ajak keluarga dan teman untuk donor bersama! Hadiah menarik bagi pendonor."},
		{"Donor Darah Masjid Istiqlal", "Masjid Istiqlal", "Jakarta", "2026-05-15", "08:00", "13:00", "PMI DKI Jakarta", "6281288888807", 120, "completed", "Donor darah di area Masjid Istiqlal bekerja sama dengan PMI. Acara berlangsung setelah sholat Jumat."},
		{"Donor Darah Peringatan Hari Ibu", "RS Dr. Kariadi", "Semarang", "2026-04-21", "09:00", "14:00", "PMI Jawa Tengah", "6281288888808", 90, "completed", "Donor darah dalam rangka Peringatan Hari Ibu. Setiap pendonor mendapat bingkisan spesial."},
		{"Aksi Donor Darah Palang Merah", "PMI Kota Medan", "Medan", "2026-05-08", "08:00", "15:00", "PMI Sumatera Utara", "6281288888809", 100, "completed", "Aksi donor darah rutin yang diselenggarakan oleh PMI Kota Medan. Terbuka untuk umum."},
	}

	db.Exec("DELETE FROM events")
	for _, e := range events {
		date, err := time.Parse("2006-01-02", e.eventDate)
		if err != nil {
			log.Printf("warning: failed to parse event date: %v", err)
			continue
		}
		_, err = db.Exec(`
			INSERT INTO events (title, description, location, city, event_date, start_time, end_time,
				organizer, contact_phone, quota, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			e.title, e.description, e.location, e.city, date, e.startTime, e.endTime,
			e.organizer, e.contact, e.quota, e.status)
		if err != nil {
			log.Printf("warning: failed to create event: %v", err)
		}
	}
	log.Printf("seeded %d events", len(events))

	if len(createdUsers) == 0 {
		log.Println("users already exist, skipping donor-related seed data")
		return
	}

	log.Printf("created %d donors total", len(createdUsers))

	hospitals := []string{
		"RSUD Dr. Soetomo", "RSUP Dr. Sardjito", "RSUP Dr. Hasan Sadikin",
		"RSUD Dr. Cipto Mangunkusumo", "RSUP Dr. Kariadi", "RS Siloam",
		"RS Mayapada", "RS Mitra Keluarga", "RS Bunda Jakarta",
		"RS Pusat Angkatan Darat", "RS Premier Jatinegara", "RS Pondok Indah",
		"RSUD Dr. Saiful Anwar", "RSUP Dr. Wahidin Sudirohusodo", "RS Dr. Soetarto",
	}
	requests := []struct {
		patientName string
		hospital    string
		bloodType   string
		rhesus      string
		bags        int
		urgency     string
		city        string
		lat         float64
		lng         float64
		notes       string
	}{
		{"Bayu Wardhana", "RSUD Dr. Soetomo", "O", "+", 5, "critical", "Surabaya", -7.2575, 112.7521, "Pasien kecelakaan lalu lintas, pendarahan dalam, butuh transfusi segera"},
		{"Ibu Sari Dewi", "RSUP Dr. Sardjito", "A", "+", 3, "critical", "Yogyakarta", -7.7956, 110.3695, "Operasi jantung terbuka, butuh 3 kantong darah siap pakai"},
		{"Ani Rahmawati", "RS Siloam Semanggi", "B", "+", 2, "urgent", "Jakarta", -6.2088, 106.8456, "Thalasemia mayor, transfusi rutin bulanan"},
		{"Bpk. Sutrisno", "RSUP Dr. Hasan Sadikin", "AB", "+", 4, "urgent", "Bandung", -6.9175, 107.6191, "Operasi ginjal, pencangkokan"},
		{"Ny. Rina Kusuma", "RS Pondok Indah", "O", "+", 2, "normal", "Jakarta", -6.2615, 106.8104, "Persalinan caesar, butuh standby darah"},
		{"Sdr. Dodi Prasetyo", "RSUP Dr. Kariadi", "A", "+", 3, "critical", "Semarang", -6.9932, 110.4203, "Kecelakaan kerja, luka parah di kaki"},
		{"Ibu Kartika Sari", "RS Bunda Jakarta", "O", "+", 2, "urgent", "Jakarta", -6.2250, 106.9000, "Post operasi tumor ovarium"},
		{"Bpk. Agus Wijaya", "RSUD Dr. Soetomo", "O", "-", 2, "urgent", "Surabaya", -7.2575, 112.7521, "Anemia aplastik, golongan darah langka O-"},
		{"Sdri. Melani Putri", "RS Mayapada Jakarta", "AB", "+", 3, "urgent", "Jakarta", -6.2088, 106.8456, "Operasi jantung bocor"},
		{"Bpk. Edi Prasetyo", "RSUD Dr. Soetomo", "O", "+", 4, "critical", "Surabaya", -7.2575, 112.7521, "Pendarahan saluran pencernaan"},
		{"Ny. Susi Susanti", "RS Premier Jatinegara", "A", "+", 2, "normal", "Jakarta", -6.2615, 106.8104, "Operasi pengangkatan kista ovarium"},
		{"Sdr. Hendra Lesmana", "RSUD Dr. Cipto Mangunkusumo", "O", "+", 5, "critical", "Jakarta", -6.2088, 106.8456, "Luka tembak, kehilangan banyak darah"},
		{"Bayi Natasha", "RS Kariadi Semarang", "B", "+", 1, "urgent", "Semarang", -6.9932, 110.4203, "Bayi prematur, butuh transfusi darah"},
		{"Bpk. Suharto", "RS Mitra Keluarga", "A", "-", 3, "urgent", "Jakarta", -6.2615, 106.8104, "Operasi prostat, golongan darah langka"},
		{"Sdri. Amanda Putri", "RSUP Dr. Sardjito", "AB", "-", 2, "critical", "Yogyakarta", -7.7956, 110.3695, "Demam berdarah dengue kritis, trombosit turun drastis"},
		{"Tn. Firman Hakim", "RS Siloam Makassar", "B", "-", 3, "urgent", "Makassar", -5.1477, 119.4327, "Operasi usus buntu, riwayat hemofilia"},
		{"Ny. Sulastri", "RSUD Dr. Sardjito", "O", "+", 2, "normal", "Yogyakarta", -7.7956, 110.3695, "Persalinan normal dengan perdarahan post partum"},
		{"Tn. Rudi Hartono", "RS Pusat Angkatan Darat", "O", "+", 4, "critical", "Jakarta", -6.2088, 106.8456, "Terkena ledakan, luka bakar luas"},
	}

	var createdRequests []*models.BloodRequest
	for _, r := range requests {
		requester := createdUsers[rng.Intn(len(createdUsers))]
		contact := requester.Phone

		req := &models.BloodRequest{
			RequesterID:  requester.ID,
			PatientName:  r.patientName,
			Hospital:     r.hospital,
			BloodType:    r.bloodType,
			Rhesus:       r.rhesus,
			Bags:         r.bags,
			Urgency:      r.urgency,
			Latitude:     r.lat,
			Longitude:    r.lng,
			City:         r.city,
			ContactPhone: contact,
			Status:       "open",
		}

		if r.notes != "" {
			req.Notes = &r.notes
		}

		err := requestRepo.Create(req)
		if err != nil {
			log.Printf("warning: failed to create blood request: %v", err)
			continue
		}
		log.Printf("created request: %s - %s (%s) [%s]", req.PatientName, req.Hospital, req.BloodType+req.Rhesus, req.Urgency)
		createdRequests = append(createdRequests, req)
	}

	fulfillRepo := repositories.NewFulfillmentRepository(db)
	partiallyFulfilled := []struct {
		reqIndex int
		donors   []struct {
			userIndex int
			bags      int
		}
	}{
		{0, []struct {
			userIndex int
			bags      int
		}{{2, 2}, {5, 1}}},
		{2, []struct {
			userIndex int
			bags      int
		}{{0, 1}}},
	}
	for _, pf := range partiallyFulfilled {
		if pf.reqIndex >= len(requests) {
			continue
		}
		req := createdRequests[pf.reqIndex]
		for _, d := range pf.donors {
			if d.userIndex >= len(createdUsers) {
				continue
			}
			donor := createdUsers[d.userIndex]
			f := &models.RequestFulfillment{
				RequestID: req.ID,
				DonorID:   donor.ID,
				Bags:      d.bags,
			}
			if err := fulfillRepo.Create(f); err != nil {
				log.Printf("warning: failed to create fulfillment: %v", err)
				continue
			}
			if _, _, err := requestRepo.AddFulfillment(req.ID, d.bags); err != nil {
				log.Printf("warning: failed to add fulfillment: %v", err)
			}
		}
	}

	for _, user := range createdUsers {
		if user.TotalDonations == 0 {
			continue
		}

		donationInterval := 90
		earliestDonation := time.Now().AddDate(0, 0, -(user.TotalDonations * donationInterval))
		donationStart := time.Date(earliestDonation.Year(), earliestDonation.Month(), earliestDonation.Day(), 0, 0, 0, 0, time.UTC)

		city := cities[rng.Intn(len(cities))]
		institution := hospitals[rng.Intn(len(hospitals))]

		for don := 0; don < user.TotalDonations; don++ {
			dDate := donationStart.AddDate(0, 0, don*donationInterval+rng.Intn(20))
			if dDate.After(time.Now()) {
				break
			}

			history := &models.DonorHistory{
				UserID:             user.ID,
				DonationDate:       dDate,
				Location:           city.city,
				Institution:        institution,
				Bags:               rng.Intn(2) + 1,
				VerificationStatus: "verified",
			}

			notes := "Donor rutin"
			history.Notes = &notes

			err := historyRepo.Create(history)
			if err != nil {
				log.Printf("warning: failed to create donor history: %v", err)
				continue
			}
		}

		if badges != nil {
			for _, badge := range badges {
				if user.TotalDonations >= badge.MinDonations {
					err := badgeRepo.AwardBadge(user.ID, badge.ID)
					if err != nil {
						log.Printf("warning: failed to award badge %s to %s: %v", badge.Name, user.Email, err)
					}
				}
			}
		}
	}

	log.Println("dummy data seeding complete")
}
