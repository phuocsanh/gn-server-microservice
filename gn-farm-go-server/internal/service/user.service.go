package service

import (
	"context"

	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/model"
	"gn-farm-go-server/internal/vo/user"
)

type (
	//.. interface
	IUserAuth interface {
		Login(ctx context.Context, in *user.LoginRequest) (codeResult int, out user.LoginResponse, err error)
		Register(ctx context.Context, in *user.RegisterRequest) (codeResult int, err error)
		VerifyOTP(ctx context.Context, in *user.VerifyOTPRequest) (out user.VerifyOTPResponse, err error)
		UpdatePasswordRegister(ctx context.Context, token string, password string) (codeResult int, userId int64, err error)
		RefreshToken(ctx context.Context, refreshToken string) (codeResult int, out user.RefreshTokenResponse, err error)
		Logout(ctx context.Context, token string) (codeResult int, out user.LogoutResponse, err error)

		// two-factor authentication
		IsTwoFactorEnabled(ctx context.Context, userId int32) (codeResult int, rs bool, err error)
		// setup authentication
		SetupTwoFactorAuth(ctx context.Context, in *user.SetupTwoFactorAuthServiceRequest) (codeResult int, err error)

		// Verify Two Factor Authentication
		VerifyTwoFactorAuth(ctx context.Context, in *user.TwoFactorVerificationServiceRequest) (codeResult int, err error)

		// List users with pagination and search
		ListUsers(ctx context.Context, input *model.PaginationRequest) (codeResult int, out *model.PaginatedResponse[database.UserProfile], err error)
	}

	IUserInfo interface {
		GetInfoByUserId(ctx context.Context) error
		GetAllUser(ctx context.Context) error
	}

	IUserAdmin interface {
		RemoveUser(ctx context.Context) error
		FindOneUser(ctx context.Context) error
	}
)

var (
	localUserAdmin IUserAdmin
	localUserInfo  IUserInfo
	localUserAuth  IUserAuth
)

func UserAdmin() IUserAdmin {
	if localUserAdmin == nil {
		panic("implement localUserAdmin not found for interface IUserAdmin")
	}
	return localUserAdmin
}

func InitUserAdmin(i IUserAdmin) {
	localUserAdmin = i
}

func UserInfo() IUserInfo {
	if localUserInfo == nil {
		panic("implement localUserInfo not found for interface IUserInfo")
	}
	return localUserInfo
}

func InitUserInfo(i IUserInfo) {
	localUserInfo = i
}

func UserAuth() IUserAuth {
	if localUserAuth == nil {
		panic("implement localUserAuth not found for interface IUserAuth")
	}
	return localUserAuth
}

func InitUserAuth(i IUserAuth) {
	localUserAuth = i
}
