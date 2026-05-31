package handlers

import (
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/pkg/blood"
)

type SearchHandler struct {
	userRepo *repositories.UserRepository
}

func NewSearchHandler(userRepo *repositories.UserRepository) *SearchHandler {
	return &SearchHandler{userRepo: userRepo}
}

type DonorWithDistance struct {
	models.User
	DistanceKm       *float64 `json:"distance_km,omitempty"`
	ButtonState      string   `json:"button_state"`
	ReasonIfDisabled string   `json:"reason_if_disabled,omitempty"`
}

func donorButtonState(u *models.User) (string, string) {
	if u.AvailabilityStatus != "available" {
		return "disabled", "Donor tidak tersedia"
	}
	switch u.EligibilityStatus {
	case "eligible":
		return "enabled", ""
	case "waiting_period":
		return "disabled", "Donor dalam masa tunggu"
	case "not_eligible":
		return "disabled", "Donor tidak memenuhi syarat"
	case "needs_clearance":
		return "disabled", "Donor memerlukan izin dokter"
	default:
		return "disabled", "Status donor tidak diketahui"
	}
}

func haversine(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func (h *SearchHandler) Search(c *gin.Context) {
	filters := map[string]interface{}{}

	if bt := c.Query("blood_type"); bt != "" {
		filters["blood_type"] = bt
	}
	if rh := c.Query("rhesus"); rh != "" {
		filters["rhesus"] = rh
	}
	if city := c.Query("city"); city != "" {
		filters["city"] = city
	}
	if status := c.Query("availability_status"); status != "" {
		filters["availability_status"] = status
	} else {
		filters["availability_status"] = "available"
	}

	var userLat, userLng *float64
	var radius float64
	hasRadius := false

	if latStr := c.Query("latitude"); latStr != "" {
		if lat, err := strconv.ParseFloat(latStr, 64); err == nil {
			userLat = &lat
		}
	}
	if lngStr := c.Query("longitude"); lngStr != "" {
		if lng, err := strconv.ParseFloat(lngStr, 64); err == nil {
			userLng = &lng
		}
	}
	if radStr := c.Query("radius"); radStr != "" {
		if r, err := strconv.ParseFloat(radStr, 64); err == nil {
			radius = r
			hasRadius = true
		}
	}

	var users []*models.User
	var err error

	if compat := c.Query("compatible_with"); compat != "" {
		bt, ok := blood.Parse(strings.ReplaceAll(compat, " ", ""))
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blood type"})
			return
		}
		compatible := blood.CompatibleDonorsFor(bt)
		types := make([]string, len(compatible))
		for i, t := range compatible {
			types[i] = string(t)
		}

		query := "SELECT * FROM users WHERE 1=1"
		args := []interface{}{}

		if city, ok := filters["city"]; ok {
			query += " AND city = ?"
			args = append(args, city)
		}
		if status, ok := filters["availability_status"]; ok {
			query += " AND availability_status = ?"
			args = append(args, status)
		}

		placeholders := make([]string, len(types))
		for i, t := range types {
			placeholders[i] = "?"
			args = append(args, t)
		}
		query += " AND (blood_type || rhesus) IN (" + strings.Join(placeholders, ",") + ")"
		query += " ORDER BY total_donations DESC"
		query = h.userRepo.Rebind(query)

		err = h.userRepo.Select(&users, query, args...)
	} else {
		users, err = h.userRepo.Search(filters)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	donors := make([]DonorWithDistance, 0, len(users))
	for _, u := range users {
		state, reason := donorButtonState(u)
		d := DonorWithDistance{
			User:             *u,
			ButtonState:      state,
			ReasonIfDisabled: reason,
		}
		if userLat != nil && userLng != nil && u.Latitude != 0 && u.Longitude != 0 {
			dist := haversine(*userLat, *userLng, u.Latitude, u.Longitude)
			d.DistanceKm = &dist
		}
		donors = append(donors, d)
	}

	if hasRadius {
		filtered := make([]DonorWithDistance, 0, len(donors))
		for _, d := range donors {
			if d.DistanceKm == nil || *d.DistanceKm <= radius {
				filtered = append(filtered, d)
			}
		}
		donors = filtered
	}

	sort.Slice(donors, func(i, j int) bool {
		if donors[i].DistanceKm == nil && donors[j].DistanceKm == nil {
			return false
		}
		if donors[i].DistanceKm == nil {
			return false
		}
		if donors[j].DistanceKm == nil {
			return true
		}
		return *donors[i].DistanceKm < *donors[j].DistanceKm
	})

	c.JSON(http.StatusOK, gin.H{"donors": donors})
}
