// +build wireinject

package upload

import (
	"github.com/google/wire"
)

// ProviderSet là tập hợp các provider cho upload service
var ProviderSet = wire.NewSet(
	ProvideConfig,
	NewCloudinaryService,
	wire.Bind(new(UploadService), new(*CloudinaryService)),
)
