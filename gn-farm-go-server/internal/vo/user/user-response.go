package user

import "gn-farm-go-server/internal/model/user"

// LoginResponse định nghĩa cấu trúc cho response đăng nhập
type LoginResponse struct {
	User      user.UserInfo  `json:"user"`
	Tokens    user.TokenPair `json:"tokens"`
	ExpiresIn int       `json:"expires_in"`
	Message   string    `json:"message,omitempty"`
}

// RegisterResponse định nghĩa cấu trúc cho response đăng ký
type RegisterResponse struct {
	Message string `json:"message"`
}

// VerifyOTPResponse định nghĩa cấu trúc cho response xác thực OTP
type VerifyOTPResponse struct {
	VerifyToken string      `json:"verify_token,omitempty"`
	User        user.UserInfo  `json:"user,omitempty"`
	Tokens      user.TokenPair `json:"tokens,omitempty"`
	ExpiresIn   int           `json:"expires_in,omitempty"`
	Message     string        `json:"message,omitempty"`
}

// RefreshTokenResponse định nghĩa cấu trúc cho response refresh token
type RefreshTokenResponse struct {
	Tokens    user.TokenPair `json:"tokens"`
	ExpiresIn int       `json:"expiresIn"`
}

// LogoutResponse định nghĩa cấu trúc cho response đăng xuất
type LogoutResponse struct {
	Message string `json:"message"`
}
