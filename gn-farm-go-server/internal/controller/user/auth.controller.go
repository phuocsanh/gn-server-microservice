package user

import (
	"fmt"
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/model"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/utils/auth"
	"gn-farm-go-server/internal/vo/user"
	"gn-farm-go-server/pkg/response"
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// management controller Auth User
var Auth = new(cUserAuth)

type cUserAuth struct{}

// UpdatePasswordRegister
// @Summary      UpdatePasswordRegister
// @Description  UpdatePasswordRegister
// @Tags         user management
// @Accept       json
// @Produce      json
// @Param        payload body user.UpdatePasswordRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/update_pass_register [post]
func (c *cUserAuth) UpdatePasswordRegister(ctx *gin.Context) {
	// Parse request body
	var req user.UpdatePasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service
	codeResult, result, err := service.UserAuth().UpdatePasswordRegister(ctx, req.UserToken, req.UserPassword)
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
// @Param        payload body user.VerifyOTPRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/verify_account [post]
func (c *cUserAuth) VerifyOTP(ctx *gin.Context) {
	// Parse request body
	var req user.VerifyOTPRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service directly with HTTP request
	result, err := service.UserAuth().VerifyOTP(ctx, &req)
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
// @Param        payload body user.LoginRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/login [post]
func (c *cUserAuth) Login(ctx *gin.Context) {
	// Parse request body
	var req user.LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service directly with HTTP request
	codeRs, dataRs, err := service.UserAuth().Login(ctx, &req)
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
// @Param        payload body user.RegisterRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/register [post]
func (c *cUserAuth) Register(ctx *gin.Context) {
	// Parse request body
	var req user.RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service directly with HTTP request
	codeStatus, err := service.UserAuth().Register(ctx, &req)
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
// @Param        payload body user.RefreshTokenRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/refresh-token [post]
func (c *cUserAuth) RefreshToken(ctx *gin.Context) {
	// Parse request body
	var req user.RefreshTokenRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service
	codeRs, dataRs, err := service.UserAuth().RefreshToken(ctx, req.RefreshToken)
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
func (c *cUserAuth) Logout(ctx *gin.Context) {
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

	codeRs, dataRs, err := service.UserAuth().Logout(ctx, token)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}
	response.SuccessResponse(ctx, codeRs, dataRs)
}

// ListUsers documentation
// @Summary      List Users
// @Description  Get paginated list of users with optional search
// @Tags         user management
// @Accept       json
// @Produce      json
// @Param        page query int false "Page number (default: 1)" example(1)
// @Param        pageSize query int false "Page size (default: 10, max: 100)" example(10)
// @Param        search query string false "Search by account or nickname" example("john")
// @Param        Authorization header string true "Bearer token"
// @Success      200  {object}  response.ResponseData
// @Failure      401  {object}  response.ErrorResponseData
// @Router       /user/list [get]
func (c *cUserAuth) ListUsers(ctx *gin.Context) {
	// Parse query parameters
	var req model.PaginationRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service (validation is done in service layer)
	codeRs, dataRs, err := service.UserAuth().ListUsers(ctx, &req)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}
	response.SuccessResponse(ctx, codeRs, dataRs)
}

// AUTO-RELOAD LIVE TEST
