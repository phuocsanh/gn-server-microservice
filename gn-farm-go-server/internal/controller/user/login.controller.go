package user

import (
	"fmt"
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/model"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/utils/auth"
	"gn-farm-go-server/pkg/response"
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// LoginRequest represents a request to login
// @Description Login request
type LoginRequest struct {
	UserAccount  string `json:"user_account" example:"user@example.com"`
	UserPassword string `json:"user_password" example:"securePassword123"`
}

// RegisterRequest represents a request to register
// @Description Register request
type RegisterRequest struct {
	VerifyKey     string `json:"verify_key" example:"user@example.com"`
	VerifyType    int    `json:"verify_type" example:"1"`
	VerifyPurpose string `json:"verify_purpose" example:"TEST_USER"`
}

// VerifyOTPRequest represents a request to verify OTP
// @Description Verify OTP request
type VerifyOTPRequest struct {
	VerifyKey  string `json:"verify_key" example:"user@example.com"`
	VerifyCode string `json:"verify_code" example:"123456"`
}

// UpdatePasswordRequest represents a request to update password after registration
// @Description Update password request
type UpdatePasswordRequest struct {
	UserToken    string `json:"user_token" example:"abc123token"`
	UserPassword string `json:"user_password" example:"newSecurePassword123"`
}

// management controller Login User
var Login = new(cUserLogin)

type cUserLogin struct{}

// UpdatePasswordRegister
// @Summary      UpdatePasswordRegister
// @Description  UpdatePasswordRegister
// @Tags         user management
// @Accept       json
// @Produce      json
// @Param        payload body UpdatePasswordRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/update_pass_register [post]
func (c *cUserLogin) UpdatePasswordRegister(ctx *gin.Context) {
	var params model.UpdatePasswordRegisterInput
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	codeResult, result, err := service.UserLogin().UpdatePasswordRegister(ctx, params.UserToken, params.UserPassword)
	if err != nil {
		response.ErrorResponse(ctx, codeResult, err.Error())
		return
	}
	response.SuccessResponse(ctx, response.ErrCodeSuccess, result)
}

// Verify OTP Login By User
// @Summary      Verify OTP Login By User
// @Description  Verify OTP Login By User
// @Tags         user management
// @Accept       json
// @Produce      json
// @Param        payload body VerifyOTPRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/verify_account [post]
func (c *cUserLogin) VerifyOTP(ctx *gin.Context) {
	var params model.VerifyInput
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	result, err := service.UserLogin().VerifyOTP(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrInvalidOTP, err.Error())
		return
	}
	response.SuccessResponse(ctx, response.ErrCodeSuccess, result)
}

// User Login
// @Summary      User Login
// @Description  User Login
// @Tags         user management
// @Accept       json
// @Produce      json
// @Param        payload body LoginRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/login [post]
func (c *cUserLogin) Login(ctx *gin.Context) {
	// Implement logic for login
	var params model.LoginInput
	fmt.Println("Login called with userAccount controller:", params.UserAccount, "and userPassword:", params.UserPassword)
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	codeRs, dataRs, err := service.UserLogin().Login(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	response.SuccessResponse(ctx, codeRs, dataRs)
}

// User Registration documentation
// @Summary      User Registration
// @Description  When user is registered send otp to email
// @Tags         user management
// @Accept       json
// @Produce      json
// @Param        payload body RegisterRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/register [post]
func (c *cUserLogin) Register(ctx *gin.Context) {
	var params model.RegisterInput
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	codeStatus, err := service.UserLogin().Register(ctx, &params)
	if err != nil {
		global.Logger.Error("Error registering user OTP", zap.Error(err))
		response.ErrorResponse(ctx, codeStatus, err.Error())
		return
	}
	// Nếu mã trả về không phải success, trả lỗi tương ứng
	if codeStatus != response.ErrCodeSuccess {
		response.ErrorResponse(ctx, codeStatus, "")
		return
	}
	response.SuccessResponse(ctx, response.ErrCodeSuccess, nil)
}
// RefreshToken documentation
// @Summary      Refresh Token
// @Description  Refresh access token using refresh token
// @Tags         user management
// @Accept       json
// @Produce      json
// @Param        payload body model.RefreshTokenInput true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/refresh-token [post]
func (c *cUserLogin) RefreshToken(ctx *gin.Context) {
	var params model.RefreshTokenInput
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	codeRs, dataRs, err := service.UserLogin().RefreshToken(ctx, params.RefreshToken)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}
	response.SuccessResponse(ctx, codeRs, dataRs)
}

// Logout documentation
// @Summary      Logout
// @Description  Logout user and invalidate token
// @Tags         user management
// @Accept       json
// @Produce      json
// @Param        Authorization header string true "Bearer token"
// @Success      200  {object}  response.ResponseData
// @Failure      401  {object}  response.ErrorResponseData
// @Router       /user/logout [post]
func (c *cUserLogin) Logout(ctx *gin.Context) {
	// Lấy token từ header Authorization
	authHeader := ctx.GetHeader("Authorization")
	if authHeader == "" {
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, "Authorization header is required")
		return
	}

	// Kiểm tra định dạng "Bearer token"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, "Authorization header format must be Bearer {token}")
		return
	}

	token := parts[1]
	log.Println("Logout token:", token)

	// Thử xác thực token trước khi gọi service
	claims, err := auth.VerifyTokenSubject(token)
	if err != nil {
		log.Println("Token verification error in controller:", err)
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, fmt.Sprintf("Invalid token: %v", err))
		return
	}
	log.Println("Token subject:", claims.Subject)

	codeRs, dataRs, err := service.UserLogin().Logout(ctx, token)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}
	response.SuccessResponse(ctx, codeRs, dataRs)
}

// AUTO-RELOAD LIVE TEST
