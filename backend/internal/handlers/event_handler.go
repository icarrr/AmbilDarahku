package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type EventHandler struct {
	eventRepo *repositories.EventRepository
}

func NewEventHandler(eventRepo *repositories.EventRepository) *EventHandler {
	return &EventHandler{eventRepo: eventRepo}
}

func (h *EventHandler) List(c *gin.Context) {
	events, err := h.eventRepo.FindUpcoming()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch events"})
		return
	}
	if events == nil {
		events = []*models.Event{}
	}
	c.JSON(http.StatusOK, gin.H{"events": events})
}

func (h *EventHandler) Create(c *gin.Context) {
	var input models.Event
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Title == "" || input.Location == "" || input.City == "" || input.EventDate.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, location, city, and event_date are required"})
		return
	}

	if input.Quota <= 0 {
		input.Quota = 50
	}
	if input.Status == "" {
		input.Status = "upcoming"
	}

	if err := h.eventRepo.Create(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"event": input})
}
