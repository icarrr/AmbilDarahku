package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type SearchHandler struct {
	userRepo *repositories.UserRepository
}

func NewSearchHandler(userRepo *repositories.UserRepository) *SearchHandler {
	return &SearchHandler{userRepo: userRepo}
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

	users, err := h.userRepo.Search(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"donors": users})
}
