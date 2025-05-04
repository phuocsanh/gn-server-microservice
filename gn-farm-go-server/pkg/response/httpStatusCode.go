package response

const (
	// Standard HTTP Codes (can be used directly or mapped)
	ErrCodeSuccess             = 200 // Generally use http.StatusOK
	ErrCodeParamInvalid        = 400 // Generally use http.StatusBadRequest
	ErrCodeUnauthorized        = 401 // Generally use http.StatusUnauthorized
	ErrCodeForbidden           = 403 // Generally use http.StatusForbidden
	ErrCodeNotFound            = 404 // Generally use http.StatusNotFound
	ErrCodeInternalServerError = 500 // Generally use http.StatusInternalServerError

	// Custom Application Codes
	ErrCodeSuccessCustom      = 20001 // Custom Success
	ErrCodeParamInvalidCustom = 20003 // Custom Invalid Param (e.g., Email is invalid)

	ErrInvalidToken = 30001 // token is invalid
	ErrInvalidOTP   = 30002
	ErrSendEmailOtp = 30003
	// User Authentication
	ErrCodeAuthFailed = 40005
	// Register Code
	ErrCodeUserHasExists = 50001 // user has already registered

	// Err Login
	ErrCodeOtpNotExists     = 60009
	ErrCodeUserOtpNotExists = 60008

	// Two Factor Authentication
	ErrCodeTwoFactorAuthSetupFailed  = 80001
	ErrCodeTwoFactorAuthVerifyFailed = 80002
)

// message
var msg = map[int]string{
	// Standard HTTP Messages
	ErrCodeSuccess:             "Success",
	ErrCodeParamInvalid:        "Invalid parameters",
	ErrCodeUnauthorized:        "Unauthorized",
	ErrCodeForbidden:           "Forbidden",
	ErrCodeNotFound:            "Not found",
	ErrCodeInternalServerError: "Internal server error",

	// Custom Application Messages
	ErrCodeSuccessCustom:      "success",
	ErrCodeParamInvalidCustom: "Email is invalid", // Example specific message
	ErrInvalidToken:           "token is invalid",
	ErrInvalidOTP:             "Otp error",
	ErrSendEmailOtp:           "Failed to send email OTP",

	ErrCodeUserHasExists: "user has already registered",

	ErrCodeOtpNotExists:     "OTP exists but not registered",
	ErrCodeUserOtpNotExists: "User OTP not exists",
	ErrCodeAuthFailed:       "Authentication failed",

	// Two Factor Authentication
	ErrCodeTwoFactorAuthSetupFailed:  "Two Factor Authentication setup failed",
	ErrCodeTwoFactorAuthVerifyFailed: "Two Factor Authentication verify failed",
}
