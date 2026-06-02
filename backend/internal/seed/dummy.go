package seed

import (
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/pkg/utils"
	"github.com/jmoiron/sqlx"
)

type cityInfo struct {
	city     string
	province string
	district string
	lat      float64
	lng      float64
}

var cities = []cityInfo{
	{"Jakarta", "DKI Jakarta", "Jakarta Pusat", -6.2088, 106.8456},
	{"Jakarta", "DKI Jakarta", "Jakarta Selatan", -6.2615, 106.8104},
	{"Jakarta", "DKI Jakarta", "Jakarta Timur", -6.2250, 106.9000},
	{"Jakarta", "DKI Jakarta", "Jakarta Barat", -6.1676, 106.7583},
	{"Jakarta", "DKI Jakarta", "Jakarta Utara", -6.1251, 106.9038},
	{"Bandung", "Jawa Barat", "Bandung Kota", -6.9175, 107.6191},
	{"Bandung", "Jawa Barat", "Bandung Barat", -6.8541, 107.5242},
	{"Bandung", "Jawa Barat", "Cimahi", -6.8721, 107.5429},
	{"Surabaya", "Jawa Timur", "Surabaya Kota", -7.2575, 112.7521},
	{"Surabaya", "Jawa Timur", "Sidoarjo", -7.4526, 112.7174},
	{"Yogyakarta", "DI Yogyakarta", "Yogyakarta Kota", -7.7956, 110.3695},
	{"Yogyakarta", "DI Yogyakarta", "Sleman", -7.7150, 110.4121},
	{"Yogyakarta", "DI Yogyakarta", "Bantul", -7.8840, 110.3325},
	{"Medan", "Sumatera Utara", "Medan Kota", 3.5952, 98.6722},
	{"Medan", "Sumatera Utara", "Medan Barat", 3.5833, 98.6500},
	{"Makassar", "Sulawesi Selatan", "Makassar Kota", -5.1477, 119.4327},
	{"Semarang", "Jawa Tengah", "Semarang Kota", -6.9932, 110.4203},
	{"Denpasar", "Bali", "Denpasar Kota", -8.6705, 115.2126},
	{"Palembang", "Sumatera Selatan", "Palembang Kota", -2.9761, 104.7754},
	{"Manado", "Sulawesi Utara", "Manado Kota", 1.4748, 124.8421},
	{"Banjarmasin", "Kalimantan Selatan", "Banjarmasin Kota", -3.3186, 114.5944},
	{"Padang", "Sumatera Barat", "Padang Kota", -0.9471, 100.4172},
	{"Pontianak", "Kalimantan Barat", "Pontianak Kota", -0.0220, 109.3425},
}

var maleFirstNames = []string{
	"Agus", "Adi", "Ahmad", "Alex", "Andi", "Andre", "Angga", "Anton", "Ari", "Arif",
	"Bambang", "Bayu", "Budi", "Cahyo", "Dani", "Dedi", "Denny", "Dicky", "Dimas", "Doni",
	"Edo", "Eko", "Fajar", "Fandi", "Farid", "Ferry", "Galih", "Gatot", "Gilang", "Gunawan",
	"Hadi", "Hendra", "Heru", "Husni", "Indra", "Irfan", "Joko", "Kurnia", "Lukman", "Mulyadi",
	"Nanda", "Novian", "Nugroho", "Prabowo", "Prasetya", "Rahmat", "Raka", "Rangga", "Reza", "Ricky",
	"Rizky", "Rudi", "Sandy", "Sigit", "Sugeng", "Surya", "Taufik", "Teguh", "Tri", "Untung",
	"Wahyu", "Wawan", "Widodo", "Yanto", "Yoga", "Yudi", "Zainal", "Hari", "Putra", "Satria",
}

var femaleFirstNames = []string{
	"Ani", "Anita", "Ayu", "Citra", "Dewi", "Dian", "Dina", "Dwi", "Elisa", "Endah",
	"Feni", "Fitri", "Gita", "Hesti", "Indah", "Indri", "Intan", "Irma", "Isna", "Kartika",
	"Lestari", "Lina", "Mala", "Maya", "Melati", "Nina", "Novi", "Nurul", "Putri", "Ratih",
	"Ratna", "Reni", "Rina", "Rini", "Risa", "Riska", "Rizka", "Sari", "Siska", "Siti",
	"Sri", "Susanti", "Tanti", "Tina", "Triana", "Vera", "Vina", "Wati", "Wulan", "Yani",
	"Yuli", "Yunita", "Zahra", "Adinda", "Bella", "Cindy", "Elvira", "Fany", "Gracia", "Helena",
}

var lastNames = []string{
	"Agustina", "Anggraini", "Ardiansyah", "Cahyadi", "Darmawan", "Firmansyah", "Gunawan", "Handayani",
	"Hartono", "Hermawan", "Hidayat", "Irawan", "Iswanto", "Kurniawan", "Kusuma", "Kuswanto",
	"Lestari", "Maulana", "Mulyani", "Nasution", "Nugroho", "Pamungkas", "Pertiwi", "Prabowo",
	"Prasetya", "Prasetyo", "Pratama", "Purwanto", "Putra", "Putri", "Rahayu", "Rahmawati",
	"Ramadhani", "Santoso", "Saputra", "Saputri", "Setiawan", "Sinaga", "Siregar", "Subekti",
	"Sulistyo", "Susanto", "Susilowati", "Syahputra", "Tambunan", "Utami", "Wahyuni", "Wijaya",
	"Wulandari", "Yulianto",
}

var hospitals = []string{
	"RSUD Dr. Soetomo Surabaya",
	"RSUP Dr. Sardjito Yogyakarta",
	"RSUP Dr. Hasan Sadikin Bandung",
	"RSUD Dr. Cipto Mangunkusumo Jakarta",
	"RSUP Dr. Kariadi Semarang",
	"RS Siloam Semanggi",
	"RS Mayapada Jakarta",
	"RS Mitra Keluarga Kelapa Gading",
	"RS Bunda Jakarta",
	"RS Pusat Angkatan Darat Gatot Soebroto",
	"RS Premier Jatinegara",
	"RS Pondok Indah",
	"RSUD Dr. Saiful Anwar Malang",
	"RSUP Dr. Wahidin Sudirohusodo Makassar",
	"RS Dr. Soetarto Yogyakarta",
	"RS PHC Surabaya",
	"RS Dr. OEN Solo Baru",
	"RS Bethesda Yogyakarta",
	"RS Panti Rapih Yogyakarta",
	"RSUD Dr. Soedarso Pontianak",
	"RS Harapan Kita Jakarta",
	"RS Fatmawati Jakarta",
	"RSAL Dr. Mintohardjo Jakarta",
	"RSUP H. Adam Malik Medan",
	"RS Santa Elisabeth Medan",
	"RSUP Dr. M. Djamil Padang",
	"RSUD Dr. Soehadi Prijonegoro Sragen",
	"RS Dr. Wahidin Sudirohusodo Makassar",
	"RSUP Prof. Dr. R.D. Kandou Manado",
	"RSUD Dr. Doris Sylvanus Palangka Raya",
	"RSUD Ulin Banjarmasin",
	"RS Ibu dan Anak Bunda Denpasar",
	"RS Bali Med Denpasar",
	"RS Siloam Makassar",
	"RSUD Dr. R. Soedjati Soemodiardjo Purwodadi",
	"RS Primaya Bekasi",
}

func randomPhone(rng *rand.Rand) string {
	prefixes := []string{"62812", "62813", "62815", "62817", "62819", "62821", "62822", "62823",
		"62838", "62852", "62853", "62855", "62856", "62857", "62858", "62859",
		"62877", "62878", "62879", "62881", "62882", "62883", "62895", "62896",
		"62897", "62898", "62899"}
	prefix := prefixes[rng.Intn(len(prefixes))]
	digits := rng.Intn(100000000)
	return fmt.Sprintf("%s%08d", prefix, digits)
}

func randomEmailForDupes(rng *rand.Rand, city string, idx int) string {
	domains := []string{"gmail.com", "yahoo.com", "outlook.com"}
	cleanCity := strings.ToLower(strings.ReplaceAll(city, " ", ""))
	domain := domains[rng.Intn(len(domains))]
	return fmt.Sprintf("donor.%s%d@%s", cleanCity, idx, domain)
}

func weightedPick[T any](rng *rand.Rand, items []T, weights []int) T {
	total := 0
	for _, w := range weights {
		total += w
	}
	r := rng.Intn(total)
	for i, w := range weights {
		r -= w
		if r < 0 {
			return items[i]
		}
	}
	return items[len(items)-1]
}

func pickBloodType(rng *rand.Rand) string {
	return weightedPick(rng,
		[]string{"O", "A", "B", "AB"},
		[]int{41, 32, 19, 8},
	)
}

func pickRhesus(rng *rand.Rand) string {
	if rng.Intn(100) < 95 {
		return "+"
	}
	return "-"
}

func pickGender(rng *rand.Rand) string {
	return weightedPick(rng, []string{"male", "female"}, []int{55, 45})
}

func pickEligibility(rng *rand.Rand) string {
	return weightedPick(rng,
		[]string{"eligible", "waiting_period", "not_eligible", "needs_clearance"},
		[]int{30, 55, 10, 5},
	)
}

func pickAvailability(rng *rand.Rand) string {
	return weightedPick(rng,
		[]string{"available", "temporarily_unavailable", "permanently_unavailable"},
		[]int{60, 30, 10},
	)
}

func donationCountByAgeBucket(rng *rand.Rand, age int) int {
	switch {
	case age < 20:
		return weightedPick(rng, []int{0, 1, 2, 3}, []int{50, 30, 15, 5})
	case age < 30:
		return weightedPick(rng, []int{0, 1, 3, 5, 8, 12}, []int{20, 25, 20, 18, 10, 7})
	case age < 40:
		return weightedPick(rng, []int{0, 2, 5, 10, 18, 30}, []int{10, 20, 20, 25, 15, 10})
	case age < 50:
		return weightedPick(rng, []int{0, 5, 12, 20, 35, 60}, []int{5, 15, 25, 30, 15, 10})
	default:
		return weightedPick(rng, []int{0, 3, 10, 25, 45, 80}, []int{5, 15, 25, 30, 15, 10})
	}
}

func generateDonationsForUser(rng *rand.Rand, count int) []time.Time {
	if count == 0 {
		return nil
	}
	dates := make([]time.Time, 0, count)
	now := time.Now()

	intervalDays := 90 + rng.Intn(30)
	earliest := now.AddDate(0, 0, -(count * intervalDays))
	earliest = time.Date(earliest.Year(), earliest.Month(), earliest.Day(), 0, 0, 0, 0, time.UTC)

	cursor := earliest
	for i := 0; i < count; i++ {
		offset := rng.Intn(25)
		d := cursor.AddDate(0, 0, offset)
		if d.After(now) {
			break
		}
		dates = append(dates, d)
		cursor = cursor.AddDate(0, 0, intervalDays)
	}
	return dates
}

func SeedDummy(db *sqlx.DB) {
	userRepo := repositories.NewUserRepository(db)
	badgeRepo := repositories.NewBadgeRepository(db)
	requestRepo := repositories.NewBloodRequestRepository(db)
	historyRepo := repositories.NewDonorHistoryRepository(db)
	fulfillRepo := repositories.NewFulfillmentRepository(db)

	log.Println("seeding production-like dummy data...")

	badges, err := badgeRepo.FindAll()
	if err != nil || len(badges) == 0 {
		log.Printf("warning: no badges found, skipping badge assignment")
		badges = nil
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	commonPassword := "donor123"
	hash, err := utils.HashPassword(commonPassword)
	if err != nil {
		log.Printf("warning: failed to hash password: %v", err)
		return
	}

	_ = db.MustExec("DELETE FROM donor_histories")
	_ = db.MustExec("DELETE FROM user_badges")
	_ = db.MustExec("DELETE FROM request_fulfillments")
	_ = db.MustExec("DELETE FROM blood_requests")
	_ = db.MustExec("DELETE FROM events")
	_ = db.MustExec("DELETE FROM users WHERE role = 'donor'")

	targetPerCity := 100
	totalTarget := targetPerCity * len(cities)

	log.Printf("target: %d donors across %d cities", totalTarget, len(cities))

	var createdUsers []*models.User
	globalEmailCounter := 0

	for i := 0; i < totalTarget; i++ {
		ci := i % len(cities)
		globalEmailCounter++
		city := cities[ci]

		gender := pickGender(rng)
		var firstName string
		if gender == "male" {
			firstName = maleFirstNames[rng.Intn(len(maleFirstNames))]
		} else {
			firstName = femaleFirstNames[rng.Intn(len(femaleFirstNames))]
		}
		lastName := lastNames[rng.Intn(len(lastNames))]
		fullName := firstName + " " + lastName

		age := 17 + rng.Intn(44)
		if age < 17 {
			age = 17
		}
		if age > 65 {
			age = 65
		}
		dob := time.Date(
			time.Now().Year()-age,
			time.Month(rng.Intn(12)+1),
			rng.Intn(28)+1,
			0, 0, 0, 0, time.UTC,
		)

		bloodType := pickBloodType(rng)
		rhesus := pickRhesus(rng)

		var weight float64
		var height float64
		if gender == "male" {
			weight = 55 + rng.Float64()*30
			height = 160 + rng.Float64()*22
		} else {
			weight = 42 + rng.Float64()*28
			height = 148 + rng.Float64()*22
		}

		donationCount := donationCountByAgeBucket(rng, age)
		totalPoints := donationCount * 10
		if totalPoints > 0 {
			totalPoints += rng.Intn(5)
		}

		eligibility := pickEligibility(rng)
		availability := pickAvailability(rng)

		email := randomEmailForDupes(rng, city.city, globalEmailCounter)
		phone := randomPhone(rng)

		var username string
		baseUsername := strings.NewReplacer(" ", ".", "'", "", "-", "").Replace(strings.ToLower(fullName))
		username = fmt.Sprintf("%s.%d", baseUsername, globalEmailCounter)

		latOffset := (rng.Float64() - 0.5) * 0.06
		lngOffset := (rng.Float64() - 0.5) * 0.06

		user := &models.User{
			FullName:           fullName,
			Phone:              phone,
			Email:              email,
			PasswordHash:       hash,
			Role:               "donor",
			DateOfBirth:        dob,
			Gender:             gender,
			BloodType:          bloodType,
			Rhesus:             rhesus,
			WeightKg:           weight,
			HeightCm:           height,
			Province:           city.province,
			City:               city.city,
			District:           city.district,
			Latitude:           city.lat + latOffset,
			Longitude:          city.lng + lngOffset,
			AvailabilityMode:   "automatic",
			AvailabilityStatus: availability,
			EligibilityStatus:  eligibility,
			TotalPoints:        totalPoints,
			EmailVerified:      true,
		}

		if donationCount > 0 {
			user.TotalDonations = donationCount
		}

		user.Username = &username

		err := userRepo.Create(user)
		if err != nil {
			errStr := err.Error()
			if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "unique") {
				altPhone := randomPhone(rng)
				user.Phone = altPhone
				altEmail := randomEmailForDupes(rng, city.city, globalEmailCounter+10000)
				user.Email = altEmail
				altUname := fmt.Sprintf("%s.%d", baseUsername, globalEmailCounter+10000)
				user.Username = &altUname
				err = userRepo.Create(user)
				if err != nil {
					continue
				}
			} else {
				continue
			}
		}

		donationDates := generateDonationsForUser(rng, donationCount)
		if len(donationDates) > 0 {
			lastDate := donationDates[len(donationDates)-1]
			user.LastDonationDate = &lastDate

			var actualEligibility string
			daysSinceLastDonation := int(time.Since(lastDate).Hours() / 24)
			if daysSinceLastDonation < 60 {
				actualEligibility = "waiting_period"
			} else if daysSinceLastDonation < 90 {
				actualEligibility = "eligible"
			} else {
				actualEligibility = eligibility
			}
			user.EligibilityStatus = actualEligibility
		}

		_, err = db.Exec(`
			UPDATE users SET
				total_donations = $2, total_points = $3, eligibility_status = $4,
				availability_status = $5, last_donation_date = $6
			WHERE id = $1`,
			user.ID, user.TotalDonations, user.TotalPoints,
			user.EligibilityStatus, user.AvailabilityStatus, user.LastDonationDate)
		if err != nil {
			log.Printf("warning: failed to update donor stats for %s: %v", user.Email, err)
		}

		createdUsers = append(createdUsers, user)
	}

	log.Printf("created %d donors total", len(createdUsers))

	log.Println("seeding donor history records and awarding badges...")
	tx, err := db.Begin()
	if err != nil {
		log.Printf("warning: failed to begin tx: %v", err)
	} else {
		histStmt, err := tx.Prepare(`
			INSERT INTO donor_histories (user_id, donation_date, location, institution, bags, notes,
				proof_photo, proof_card, proof_letter, verification_status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`)
		if err != nil {
			log.Printf("warning: failed to prepare hist stmt: %v", err)
			tx.Rollback()
			tx = nil
		} else {
			defer histStmt.Close()
			for _, user := range createdUsers {
				if user.TotalDonations == 0 {
					continue
				}

				donationDates := generateDonationsForUser(rng, user.TotalDonations)
				for _, dDate := range donationDates {
					inst := hospitals[rng.Intn(len(hospitals))]
					location := user.City
					bags := 1
					if rng.Intn(10) < 2 {
						bags = 2
					}

					notes := "Donor rutin"
					_, err := histStmt.Exec(
						user.ID, dDate, location, inst, bags, notes,
						nil, nil, nil, "verified",
					)
					if err != nil {
						continue
					}
				}

				if badges != nil {
					for _, badge := range badges {
						if user.TotalDonations >= badge.MinDonations {
							_, _ = tx.Exec(
								"INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
								user.ID, badge.ID)
						}
					}
				}
			}
			if err := tx.Commit(); err != nil {
				log.Printf("warning: tx commit failed: %v", err)
			}
		}
	}
	if tx == nil {
		// fallback: individual inserts
		for _, user := range createdUsers {
			if user.TotalDonations == 0 {
				continue
			}

			donationDates := generateDonationsForUser(rng, user.TotalDonations)
			for _, dDate := range donationDates {
				inst := hospitals[rng.Intn(len(hospitals))]
				location := user.City
				bags := 1
				if rng.Intn(10) < 2 {
					bags = 2
				}

				history := &models.DonorHistory{
					UserID:             user.ID,
					DonationDate:       dDate,
					Location:           location,
					Institution:        inst,
					Bags:               bags,
					VerificationStatus: "verified",
				}
				notes := "Donor rutin"
				history.Notes = &notes

				_ = historyRepo.Create(history)
			}

			if badges != nil {
				for _, badge := range badges {
					if user.TotalDonations >= badge.MinDonations {
						_ = badgeRepo.AwardBadge(user.ID, badge.ID)
					}
				}
			}
		}
	}
	log.Printf("donor histories and badges awarded")

	db.MustExec("DELETE FROM events")

	eventTemplates := []struct {
		title       string
		desc        string
		status      string
		location    string
		daysOffset  int
		organizer   string
		quota       int
		startTime   string
		endTime     string
	}{
		{"Donor Darah Peringatan Hari Darah Sedunia", "Donor darah massal dalam rangka Hari Donor Darah Sedunia. Terbuka untuk umum dengan syarat sehat jasmani. Setiap pendonor mendapatkan bingkisan eksklusif dan snack sehat.", "upcoming", "RSUD Dr. Soetomo Surabaya", 14, "PMI Jawa Timur", 200, "08:00", "16:00"},
		{"Bhakti Sosial Kesehatan Jakarta", "Kegiatan bakti sosial donor darah yang diselenggarakan oleh PMI DKI Jakarta bekerja sama dengan Pemerintah Provinsi DKI Jakarta.", "upcoming", "Balai Kota Jakarta Pusat", 9, "PMI DKI Jakarta", 150, "08:00", "14:00"},
		{"Donor Darah RS Harapan Kita", "Donor darah rutin bulanan di RS Harapan Kita. Tersedia layanan konsultasi kesehatan gratis bagi pendonor.", "upcoming", "RS Harapan Kita, Jakarta", 16, "RS Harapan Kita", 100, "09:00", "15:00"},
		{"Donor Darah Bulanan Bandung", "Donor darah bulanan di RS Santosa Bandung. Setiap pendonor mendapat snack dan vitamin gratis. Donor ke-5 mendapat hadiah spesial.", "upcoming", "RS Santosa Bandung", 20, "PMI Jawa Barat", 80, "08:00", "14:00"},
		{"Gerakan Donor Darah Kampus UGM", "Gerakan donor darah mahasiswa UGM. Terbuka untuk mahasiswa dan masyarakat umum. Tersedia konsultasi gizi dan cek kesehatan gratis.", "upcoming", "Universitas Gadjah Mada Yogyakarta", 26, "UGM & PMI Sleman", 200, "09:00", "15:00"},
		{"Donor Darah Komunitas AmbilDarahku", "Event donor darah komunitas AmbilDarahku. Ajak keluarga dan teman untuk donor bersama! Hadiah menarik bagi pendonor ke-10.", "upcoming", "Mall Grand Indonesia Jakarta", 30, "AmbilDarahku Community", 120, "10:00", "17:00"},
		{"Donor Darah Masjid Istiqlal", "Donor darah di area Masjid Istiqlal bekerja sama dengan PMI. Setiap Jumat setelah sholat Jumat. Pendaftaran dibuka mulai pukul 07.00.", "completed", "Masjid Istiqlal Jakarta", -30, "PMI DKI Jakarta", 120, "08:00", "13:00"},
		{"Donor Darah Peringatan Hari Ibu", "Donor darah dalam rangka Peringatan Hari Ibu. Setiap pendonor mendapat bingkisan spesial dan bunga untuk para ibu.", "completed", "RS Dr. Kariadi Semarang", -60, "PMI Jawa Tengah", 90, "09:00", "14:00"},
		{"Aksi Donor Darah PMI Medan", "Aksi donor darah rutin yang diselenggarakan oleh PMI Kota Medan. Terbuka untuk umum. Setiap pendonor mendapat suplemen vitamin.", "completed", "PMI Kota Medan", -45, "PMI Sumatera Utara", 100, "08:00", "15:00"},
		{"Donor Darah Kampus ITS", "Donor darah mahasiswa ITS Surabaya dalam rangka Dies Natalis. Terbuka untuk mahasiswa dan masyarakat umum.", "upcoming", "Institut Teknologi Sepuluh Nopember Surabaya", 40, "PMI Jawa Timur", 180, "08:00", "15:00"},
		{"Donor Darah Paskah", "Donor darah dalam rangka perayaan Paskah. Setiap pendonor mendapat telur Paskah dan bingkisan spesial.", "completed", "Gereja Katedral Jakarta", -120, "PMI DKI Jakarta", 75, "09:00", "13:00"},
		{"Donor Darah Hari Pancasila", "Donor darah memperingati Hari Lahir Pancasila. Ayo donor dan wujudkan sila kemanusiaan.", "completed", "Lapangan Monas Jakarta", -80, "PMI DKI Jakarta", 200, "07:00", "14:00"},
		{"Donor Darah Ramadan Berkah", "Donor darah spesial bulan Ramadan. Buka puasa bersama bagi pendonor setelah donor.", "completed", "Masjid Al-Akbar Surabaya", -100, "PMI Jawa Timur", 150, "15:00", "20:00"},
		{"Donor Darah HUT RI ke-81", "Donor darah dalam rangka HUT Kemerdekaan RI. Setiap pendonor mendapat kaos eksklusif dan merchandise.", "upcoming", "Istana Negara Jakarta", 55, "PMI DKI Jakarta", 250, "08:00", "16:00"},
		{"Donor Darah Bali", "Donor darah massal di Pulau Dewata. Dukungan untuk persediaan darah PMI Bali.", "upcoming", "Lapangan Puputan Renon Denpasar", 22, "PMI Bali", 160, "08:00", "15:00"},
		{"Donor Darah Palembang", "Donor darah kota Palembang dalam rangka Hari Kesehatan Nasional.", "upcoming", "RS Dr. AK Gani Palembang", 35, "PMI Sumatera Selatan", 100, "09:00", "14:00"},
		{"Donor Darah Manado", "Donor darah terbesar di Sulawesi Utara. Target 150 kantong darah.", "upcoming", "Megamall Manado", 42, "PMI Sulawesi Utara", 150, "10:00", "17:00"},
		{"Donor Darah Banjarmasin", "Donor darah di kota seribu sungai. Ayo donor bersama PMI Banjarmasin.", "upcoming", "RSUD Ulin Banjarmasin", 28, "PMI Kalimantan Selatan", 80, "08:00", "14:00"},
		{"Donor Darah Padang", "Donor darah kota Padang. Setiap pendonor mendapat rendang paket spesial.", "upcoming", "RS M. Djamil Padang", 33, "PMI Sumatera Barat", 90, "08:00", "15:00"},
		{"Donor Darah Pontianak", "Donor darah di Kalimantan Barat. Ajak keluarga dan kerabat untuk donor.", "upcoming", "RSUD Dr. Soedarso Pontianak", 37, "PMI Kalimantan Barat", 85, "08:00", "14:00"},
		{"Donor Darah Makassar", "Donor darah rutin bulanan PMI Makassar. Terbuka untuk umum.", "upcoming", "RSUP Dr. Wahidin Sudirohusodo Makassar", 12, "PMI Sulawesi Selatan", 120, "08:00", "15:00"},
		{"Donor Darah Milenial", "Event donor darah khusus milenial dan gen Z. Musik, games, dan doorprize menarik!", "upcoming", "GBK Jakarta", 45, "AmbilDarahku Community", 300, "09:00", "18:00"},
		{"Donor Darah Peringatan Sumpah Pemuda", "Donor darah memperingati Hari Sumpah Pemuda. Wujud nyata semangat pemuda Indonesia.", "upcoming", "Tugu Muda Semarang", 60, "PMI Jawa Tengah", 130, "08:00", "14:00"},
		{"Donor Darah Mingguan PMI Jakarta", "Donor darah rutin mingguan di kantor PMI DKI Jakarta. Setiap hari Sabtu.", "upcoming", "Kantor PMI DKI Jakarta", 3, "PMI DKI Jakarta", 50, "08:00", "12:00"},
		{"Donor Darah HUT Kota Bandung", "Donor darah memeriahkan HUT Kota Bandung. Target 200 pendonor.", "upcoming", "Alun-Alun Bandung", 48, "PMI Jawa Barat", 200, "08:00", "16:00"},
		{"Donor Darah TNI-Polri", "Donor darah gabungan TNI dan Polri. Mendukung ketahanan darah nasional.", "upcoming", "Markas Besar TNI Cilangkap Jakarta", 70, "PMI DKI Jakarta", 500, "07:00", "16:00"},
		{"Donor Darah Bank Darah", "Donor darah untuk stok bank darah nasional. Setiap golongan darah dibutuhkan.", "upcoming", "Gedung PMI Pusat Jakarta", 5, "PMI DKI Jakarta", 100, "08:00", "15:00"},
		{"Donor Darah Komunitas Motor", "Donor darah komunitas motor Indonesia. Ride to donate!", "upcoming", "Parkir Timur Senayan Jakarta", 51, "AmbilDarahku Community", 150, "07:00", "14:00"},
		{"Donor Darah Relawan Bencana", "Donor darah untuk kesiapsiagaan bencana alam. Donasi darahmu sangat berarti.", "upcoming", "Kantor BPBD Jakarta", 65, "PMI DKI Jakarta", 120, "08:00", "15:00"},
	}

	eventCities := []string{"Jakarta", "Surabaya", "Bandung", "Yogyakarta", "Semarang", "Denpasar", "Palembang", "Manado", "Banjarmasin", "Padang", "Pontianak", "Makassar", "Medan"}

	for i, et := range eventTemplates {
		ec := eventCities[i%len(eventCities)]
		eventDate := time.Now().AddDate(0, 0, et.daysOffset)
		eventDate = time.Date(eventDate.Year(), eventDate.Month(), eventDate.Day(), 0, 0, 0, 0, time.UTC)

		contactPrefixes := []string{"628128888", "628138888", "628158888", "628178888", "628198888"}
		contact := fmt.Sprintf("%s%02d", contactPrefixes[rng.Intn(len(contactPrefixes))], i+1)

		org := et.organizer
		desc := et.desc

		_, err := db.Exec(`
			INSERT INTO events (title, description, location, city, event_date, start_time, end_time,
				organizer, contact_phone, quota, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			et.title, desc, et.location, ec, eventDate, et.startTime, et.endTime,
			org, contact, et.quota, et.status)
		if err != nil {
			log.Printf("warning: failed to create event: %v", err)
		}
	}
	log.Printf("seeded %d events across %d cities", len(eventTemplates), len(eventCities))

	requestTemplates := []struct {
		patientName string
		bloodType   string
		bags        int
		urgency     string
		notes       string
		hospitalIdx int
	}{
		{"Bayu Wardhana", "O", 5, "critical", "Pasien kecelakaan lalu lintas, pendarahan dalam, butuh transfusi segera", 0},
		{"Sari Dewi", "A", 3, "critical", "Operasi jantung terbuka, butuh 3 kantong darah siap pakai", 1},
		{"Ani Rahmawati", "B", 2, "urgent", "Thalasemia mayor, transfusi rutin bulanan", 4},
		{"Sutrisno", "AB", 4, "urgent", "Operasi ginjal, pencangkokan donor hidup", 2},
		{"Rina Kusuma", "O", 2, "normal", "Persalinan caesar, butuh standby darah", 11},
		{"Dodi Prasetyo", "A", 3, "critical", "Kecelakaan kerja, luka parah di kaki, kehilangan banyak darah", 5},
		{"Kartika Sari", "O", 2, "urgent", "Post operasi tumor ovarium, masa pemulihan", 22},
		{"Agus Wijaya", "O", 2, "urgent", "Anemia aplastik, golongan darah langka", 0},
		{"Melani Putri", "AB", 3, "urgent", "Operasi jantung bocor, usia 7 tahun", 6},
		{"Edi Prasetyo", "O", 4, "critical", "Pendarahan saluran pencernaan, hemoglobin drop", 0},
		{"Susi Susanti", "A", 2, "normal", "Operasi pengangkatan kista ovarium", 10},
		{"Hendra Lesmana", "O", 5, "critical", "Luka tembak, kehilangan banyak darah, ICU", 3},
		{"Natasha Kusuma", "B", 1, "urgent", "Bayi prematur 32 minggu, butuh transfusi segera", 4},
		{"Suharto", "A", 3, "urgent", "Operasi prostat, usia 72 tahun", 8},
		{"Amanda Putri", "AB", 2, "critical", "Demam berdarah dengue kritis, trombosit turun drastis", 1},
		{"Firman Hakim", "B", 3, "urgent", "Operasi usus buntu, riwayat hemofilia", 33},
		{"Sulastri", "O", 2, "normal", "Persalinan normal dengan perdarahan post partum", 17},
		{"Rudi Hartono", "O", 4, "critical", "Terkena ledakan, luka bakar luas 40%", 12},
		{"Mawar Sari", "A", 2, "urgent", "Lupus eritematosus sistemik dengan anemia berat", 7},
		{"Bambang Supriyadi", "B", 3, "normal", "Operasi hernia, persiapan transfusi", 15},
		{"Ratna Dewi", "AB", 2, "urgent", "Kanker serviks stadium awal, kemoterapi", 6},
		{"Denny Ardiansyah", "O", 3, "critical", "Kecelakaan motor, patah tulang paha, perdarahan", 13},
		{"Fitri Lestari", "A", 1, "urgent", "Plasenta previa totalis, risiko perdarahan", 18},
		{"Haryanto", "B", 4, "normal", "Operasi penggantian katup jantung", 16},
		{"Cindy Permata", "AB", 2, "urgent", "Talassemia beta mayor, butuh donor rutin", 1},
		{"Arief Budiman", "A", 3, "critical", "Infeksi berat, sepsis, hemodialisis", 3},
		{"Sri Hartati", "O", 2, "normal", "Katarak operasi dengan komorbid diabetes", 22},
		{"Irfan Hakim", "B", 5, "critical", "Luka bacok, perdarahan hebat, syok hipovolemik", 12},
		{"Yuni Astuti", "O", 2, "urgent", "Post operasi tiroid, hipokalsemia", 18},
		{"Aditya Nugraha", "A", 4, "urgent", "Gagal ginjal kronik, butuh transfusi rutin", 0},
		{"Novi Andriani", "AB", 1, "urgent", "Anemia berat pada kehamilan trimester 3", 20},
		{"Toni Setiawan", "O", 3, "normal", "Operasi amandel dengan riwayat anemia", 16},
		{"Lina Marlina", "B", 2, "urgent", "Kista ovarium pecah, perdarahan intraabdomen", 11},
		{"Rizal Fahlevi", "A", 3, "critical", "Patah tulang panggul, perdarahan retroperitoneal", 5},
		{"Winda Sari", "O", 2, "normal", "Persalinan normal, atonia uteri", 14},
		{"Doni Iskandar", "AB", 3, "urgent", "Sindrom mielodisplastik, butuh donor trombosit", 7},
		{"Siti Nurhaliza", "B", 2, "urgent", "Demam tifoid dengan perdarahan usus", 3},
		{"Faisal Rahman", "O", 4, "critical", "Kecelakaan tabrak lari, multiple fraktur", 2},
		{"Desi Ratnasari", "A", 2, "normal", "Mioma uteri, persiapan operasi", 22},
		{"Yusuf Maulana", "B", 3, "urgent", "Hemofilia A dengan perdarahan sendi", 9},
		{"Puji Lestari", "O", 1, "urgent", "Kanker darah stadium awal, kemoterapi", 1},
		{"Eko Prasetyo", "AB", 4, "normal", "Operasi penggantian sendi panggul", 21},
		{"Nadia Khairunnisa", "A", 2, "urgent", "Gagal hati akut, butuh plasma", 18},
		{"Roni Saputra", "O", 5, "critical", "Tersengat listrik, luka bakar, gagal ginjal", 13},
		{"Mega Wulandari", "B", 2, "normal", "Persalinan dengan preeklamsia berat", 19},
		{"Agung Laksono", "A", 3, "urgent", "PPOK eksaserbasi akut dengan polisitemia", 16},
		{"Ria Puspita", "AB", 2, "critical", "Perdarahan saluran cerna atas, melena", 6},
		{"Dwi Hartanto", "O", 3, "normal", "Operasi batu empedu, persiapan", 0},
		{"Vina Oktaviani", "A", 2, "urgent", "Stenosis mitral, operasi katup jantung", 22},
		{"Acep Saepuloh", "B", 4, "urgent", "Luka tusuk, perdarahan intraabdomen", 5},
		{"Linda Kuswandari", "O", 2, "normal", "Tumor payudara, persiapan mastektomi", 7},
		{"Bambang Hermanto", "AB", 3, "urgent", "Pankreatitis akut berat, ICU", 3},
		{"Rani Anggraini", "A", 2, "normal", "Anemia defisiensi besi berat", 14},
		{"Slamet Riyadi", "O", 4, "critical", "Pendarahan varises esofagus, sirosis hati", 0},
		{"Diana Permata Sari", "B", 2, "urgent", "Post operasi sektio sesarea, perdarahan", 18},
		{"Hendra Gunawan", "A", 3, "normal", "Operasi kolorektal, persiapan autologus", 15},
		{"Yuli Astuti", "O", 1, "urgent", "Demam berdarah, trombositopenia berat", 8},
		{"Rachmat Hidayat", "AB", 4, "critical", "Fraktur femur terbuka, perdarahan aktif", 24},
		{"Elsa Maharani", "B", 2, "normal", "Ca mammae kemoterapi, butuh transfusi", 22},
		{"Taufik Ismail", "O", 3, "urgent", "Bronkiektasis dengan hemoptisis masif", 5},
	}

	requestCities := []string{"Jakarta", "Surabaya", "Bandung", "Yogyakarta", "Semarang", "Denpasar", "Palembang", "Manado", "Banjarmasin", "Padang", "Pontianak", "Makassar", "Medan"}
	requestLat := map[string]float64{
		"Jakarta": -6.2088, "Surabaya": -7.2575, "Bandung": -6.9175, "Yogyakarta": -7.7956,
		"Semarang": -6.9932, "Denpasar": -8.6705, "Palembang": -2.9761, "Manado": 1.4748,
		"Banjarmasin": -3.3186, "Padang": -0.9471, "Pontianak": -0.0220, "Makassar": -5.1477,
		"Medan": 3.5952,
	}
	requestLng := map[string]float64{
		"Jakarta": 106.8456, "Surabaya": 112.7521, "Bandung": 107.6191, "Yogyakarta": 110.3695,
		"Semarang": 110.4203, "Denpasar": 115.2126, "Palembang": 104.7754, "Manado": 124.8421,
		"Banjarmasin": 114.5944, "Padang": 100.4172, "Pontianak": 109.3425, "Makassar": 119.4327,
		"Medan": 98.6722,
	}

	var createdRequests []*models.BloodRequest

	donorsByCity := make(map[string][]*models.User)
	for _, u := range createdUsers {
		donorsByCity[u.City] = append(donorsByCity[u.City], u)
	}

	for i, rt := range requestTemplates {
		rc := requestCities[i%len(requestCities)]
		rh := pickRhesus(rng)
		hospital := hospitals[rt.hospitalIdx%len(hospitals)]

		potentialRequesters := donorsByCity[rc]
		if len(potentialRequesters) == 0 {
			for _, u := range createdUsers {
				potentialRequesters = append(potentialRequesters, u)
			}
		}
		requester := potentialRequesters[rng.Intn(len(potentialRequesters))]

		urgency := rt.urgency
		var status string
		switch urgency {
		case "critical":
			status = weightedPick(rng, []string{"open", "fulfilled"}, []int{70, 30})
		case "urgent":
			status = weightedPick(rng, []string{"open", "fulfilled", "cancelled"}, []int{65, 25, 10})
		default:
			status = weightedPick(rng, []string{"open", "fulfilled", "cancelled"}, []int{60, 25, 15})
		}

		req := &models.BloodRequest{
			RequesterID:  requester.ID,
			PatientName:  rt.patientName,
			Hospital:     hospital,
			BloodType:    rt.bloodType,
			Rhesus:       rh,
			Bags:         rt.bags,
			Urgency:      urgency,
			Latitude:     requestLat[rc] + (rng.Float64()-0.5)*0.03,
			Longitude:    requestLng[rc] + (rng.Float64()-0.5)*0.03,
			City:         rc,
			ContactPhone: requester.Phone,
			Status:       status,
		}

		if rt.notes != "" {
			req.Notes = &rt.notes
		}

		err := requestRepo.Create(req)
		if err != nil {
			log.Printf("warning: failed to create blood request: %v", err)
			continue
		}

		if status == "fulfilled" {
			availableDonors := donorsByCity[rc]
			if len(availableDonors) == 0 {
				availableDonors = createdUsers
			}
			totalFilled := 0
			for totalFilled < rt.bags && len(availableDonors) > 0 {
				di := rng.Intn(len(availableDonors))
				donor := availableDonors[di]
				donorBags := 1
				if rt.bags-totalFilled > 1 && rng.Intn(2) == 0 {
					donorBags = 2
				}
				if donorBags > rt.bags-totalFilled {
					donorBags = rt.bags - totalFilled
				}
				f := &models.RequestFulfillment{
					RequestID: req.ID,
					DonorID:   donor.ID,
					Bags:      donorBags,
				}
				if err := fulfillRepo.Create(f); err != nil {
					log.Printf("warning: failed to create fulfillment: %v", err)
					break
				}
				if _, _, err := requestRepo.AddFulfillment(req.ID, donorBags); err != nil {
					log.Printf("warning: failed to add fulfillment: %v", err)
					break
				}
				totalFilled += donorBags
			}
		}

		log.Printf("created request: %s - %s (%s%s) [%s] in %s", req.PatientName, req.Hospital, req.BloodType, rh, req.Urgency, rc)
		createdRequests = append(createdRequests, req)
	}

	log.Printf("seeded %d blood requests across %d cities", len(createdRequests), len(requestCities))

	cityUserCounts := make(map[string]int)
	cityRequestCounts := make(map[string]int)
	for _, u := range createdUsers {
		cityUserCounts[u.City]++
	}
	for _, r := range createdRequests {
		cityRequestCounts[r.City]++
	}

	log.Println("===== SEED DATA DISTRIBUTION SUMMARY =====")
	log.Printf("Total donors: %d", len(createdUsers))
	for _, ci := range cities {
		uc := cityUserCounts[ci.city]
		rc := cityRequestCounts[ci.city]
		if uc > 0 || rc > 0 {
			log.Printf("  %s (%s): %d donors, %d requests", ci.city, ci.province, uc, rc)
		}
	}
	log.Printf("Total blood requests: %d", len(createdRequests))
	log.Printf("Total events: %d", len(eventTemplates))
	log.Printf("Total badges: %d", len(badges))
	log.Println("==========================================")

	log.Println("dummy data seeding complete")
}
