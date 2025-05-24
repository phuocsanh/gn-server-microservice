package user

// LoginRequest định nghĩa cấu trúc cho request đăng nhập
type LoginRequest struct {
	UserAccount  string `json:"user_account" example:"user@example.com"`
	UserPassword string `json:"user_password" example:"securePassword123"`
}

// RegisterRequest định nghĩa cấu trúc cho request đăng ký
type RegisterRequest struct {
	VerifyKey     string `json:"verify_key" example:"user@example.com"`
	VerifyType    int    `json:"verify_type" example:"1"`
	VerifyPurpose string `json:"verify_purpose" example:"TEST_USER"`
}

// VerifyOTPRequest định nghĩa cấu trúc cho request xác thực OTP
type VerifyOTPRequest struct {
	VerifyKey  string `json:"verify_key" example:"user@example.com"`
	VerifyCode string `json:"verify_code" example:"123456"`
}

// UpdatePasswordRequest định nghĩa cấu trúc cho request cập nhật mật khẩu
type UpdatePasswordRequest struct {
	UserToken    string `json:"user_token" example:"abc123token"`
	UserPassword string `json:"user_password" example:"newSecurePassword123"`
}

// RefreshTokenRequest định nghĩa cấu trúc cho request làm mới token
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

// SetupTwoFactorAuthRequest định nghĩa cấu trúc cho request thiết lập xác thực 2 yếu tố
type SetupTwoFactorAuthRequest struct {
	TwoFactorAuthType string `json:"two_factor_auth_type" example:"EMAIL"`
	TwoFactorEmail    string `json:"two_factor_email" example:"user@example.com"`
}

// TwoFactorVerificationRequest định nghĩa cấu trúc cho request xác thực 2 yếu tố
type TwoFactorVerificationRequest struct {
	VerifyKey  string `json:"verify_key" example:"user@example.com"`
	VerifyCode string `json:"verify_code" example:"123456"`
}

// ListUsersRequest định nghĩa cấu trúc cho request lấy danh sách user
type ListUsersRequest struct {
	Page     int    `form:"page" json:"page" example:"1"`                    // Trang hiện tại (bắt đầu từ 1)
	PageSize int    `form:"pageSize" json:"pageSize" example:"10"`           // Số lượng user trên mỗi trang
	Search   string `form:"search" json:"search" example:"john"`             // Từ khóa tìm kiếm theo tên/email
}
