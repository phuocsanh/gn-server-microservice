package user

import (
	"strconv"
	"strings"

	"gn-farm-go-server/internal/model"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/vo/user"
	"gn-farm-go-server/pkg/response"

	"github.com/gin-gonic/gin"
)


var TwoFA = new(sUser2FA)

type sUser2FA struct{}

// User Setup Two Factor Authentication
// @Summary      Setup two-factor authentication
// @Description  ser Setup Two Factor Authentication
// @Tags         user 2fa
// @Accept       json
// @Produce      json
// @param Authorization header string true "Authorization token" example:"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// @Param        payload body user.SetupTwoFactorAuthRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/two-factor/setup [post]
func (c *sUser2FA) SetupTwoFactorAuth(ctx *gin.Context) {
	// Get subjectUUID from JWT token
	subjectUUID, exists := ctx.Get("subjectUUID")
	if !exists {
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, "user not authenticated")
		return
	}

	// Parse request body
	var req user.SetupTwoFactorAuthRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	
	// Convert to model input
	params := model.SetupTwoFactorAuthInput{
		TwoFactorAuthType: req.TwoFactorAuthType,
		TwoFactorEmail:    req.TwoFactorEmail,
	}

	// Extract user_id from subjectUUID (format: "1clitoken...")
	subjectStr := subjectUUID.(string)
	parts := strings.Split(subjectStr, "clitoken")
	if len(parts) != 2 {
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, "invalid token format")
		return
	}
	userId, err := strconv.ParseUint(parts[0], 10, 32)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, "invalid user id in token")
		return
	}

	// Set user_id from subjectUUID
	params.UserId = uint32(userId)

	// Call service
	code, err := service.UserLogin().SetupTwoFactorAuth(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, code, err.Error())
		return
	}

	response.SuccessResponse(ctx, code, nil)
}

// User Verify Two Factor Authentication
// @Summary      Verify two-factor authentication
// @Description  ser Verify Two Factor Authentication
// @Tags         user 2fa
// @Accept       json
// @Produce      json
// @param Authorization header string true "Authorization token" example:"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// @Param        payload body user.TwoFactorVerificationRequest true "payload"
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /user/two-factor/verify [post]
func (c *sUser2FA) VerifyTwoFactorAuth(ctx *gin.Context) {
	// Get subjectUUID from JWT token
	subjectUUID, exists := ctx.Get("subjectUUID")
	if !exists {
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, "user not authenticated")
		return
	}

	// Parse request body
	var req user.TwoFactorVerificationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	
	// Convert to model input
	params := model.TwoFactorVerificationInput{
		TwoFactorCode: req.VerifyCode,
	}

	// Extract user_id from subjectUUID (format: "1clitoken...")
	subjectStr := subjectUUID.(string)
	parts := strings.Split(subjectStr, "clitoken")
	if len(parts) != 2 {
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, "invalid token format")
		return
	}
	userId, err := strconv.ParseUint(parts[0], 10, 32)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeAuthFailed, "invalid user id in token")
		return
	}

	// Set user_id from subjectUUID
	params.UserId = uint32(userId)

	// Call service
	code, err := service.UserLogin().VerifyTwoFactorAuth(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, code, err.Error())
		return
	}

	response.SuccessResponse(ctx, code, nil)
}
