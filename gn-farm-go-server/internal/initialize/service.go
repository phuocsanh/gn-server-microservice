package initialize

import (
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/wire"
)

// InitServiceInterface initializes all service interfaces
func InitServiceInterface() {
	// Initialize user services
	userAuth, err := wire.InitUserAuthService()
	if err != nil {
		panic(err)
	}
	service.InitUserAuth(userAuth)
}
