package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthRequired(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			return
		}

		token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		userID, _ := claims["user_id"].(string)
		email, _ := claims["email"].(string)
		role, _ := claims["role"].(string)
		emailVerified, _ := claims["email_verified"].(bool)

		c.Set("user_id", userID)
		c.Set("email", email)
		c.Set("role", role)
		c.Set("email_verified", emailVerified)

		c.Next()
	}
}

func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "super_admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			return
		}
		c.Next()
	}
}

var unverifiedAllowedPaths = map[string]bool{
	"/api/v1/auth/me":                  true,
	"/api/v1/auth/resend-verification": true,
	"/api/v1/auth/logout":              true,
	"/api/v1/auth/change-password":     true,
}

func EmailVerifiedRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		verified, _ := c.Get("email_verified")
		if verified == true {
			c.Next()
			return
		}
		if unverifiedAllowedPaths[c.FullPath()] {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error":             "email not verified",
			"verification_link": "/verify-email",
		})
	}
}
