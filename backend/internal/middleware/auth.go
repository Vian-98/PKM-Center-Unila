package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(secret string, allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
		if header == "" { c.JSON(http.StatusUnauthorized, gin.H{"message": "Token diperlukan"}); c.Abort(); return }
		token, err := jwt.Parse(header, func(t *jwt.Token) (interface{}, error) { return []byte(secret), nil })
		if err != nil || !token.Valid { c.JSON(http.StatusUnauthorized, gin.H{"message": "Token tidak valid"}); c.Abort(); return }
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok { c.JSON(http.StatusUnauthorized, gin.H{"message": "Token tidak valid"}); c.Abort(); return }
		role, _ := claims["role"].(string)
		if len(allowedRoles) > 0 {
			permitted := false
			for _, r := range allowedRoles { if role == r { permitted = true } }
			if !permitted { c.JSON(http.StatusForbidden, gin.H{"message": "Akses tidak diizinkan"}); c.Abort(); return }
		}
		c.Set("user", claims); c.Next()
	}
}
