package routers

import (
	"gn-farm-go-server/internal/routers/manage"
	"gn-farm-go-server/internal/routers/product"
	"gn-farm-go-server/internal/routers/user"
)

type RouterGroup struct {
	User    user.UserRouterGroup
	Manage  manage.ManageRouterGroup
	Product product.ProductRouter
}

var RouterGroupApp = new(RouterGroup)
