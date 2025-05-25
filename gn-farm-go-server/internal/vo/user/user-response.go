package user

// UserInfo định nghĩa thông tin user cơ bản
type UserInfo struct {
	UserID      int64  `json:"user_id"`
	UserAccount string `json:"user_account"`
	UserEmail   string `json:"user_email"`
}

// TokenPair định nghĩa cặp access và refresh token
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}



// LoginResponse định nghĩa cấu trúc cho response đăng nhập
type LoginResponse struct {
	User      UserInfo  `json:"user"`
	Tokens    TokenPair `json:"tokens"`
	ExpiresIn int       `json:"expires_in"`
	Message   string    `json:"message,omitempty"`
}



// VerifyOTPResponse định nghĩa cấu trúc cho response xác thực OTP
type VerifyOTPResponse struct {
	VerifyToken string    `json:"verify_token,omitempty"`
	User        UserInfo  `json:"user,omitempty"`
	Tokens      TokenPair `json:"tokens,omitempty"`
	ExpiresIn   int       `json:"expires_in,omitempty"`
	Message     string    `json:"message,omitempty"`
}

// RefreshTokenResponse định nghĩa cấu trúc cho response refresh token
type RefreshTokenResponse struct {
	User      UserInfo  `json:"user"`
	Tokens    TokenPair `json:"tokens"`
	ExpiresIn int       `json:"expires_in"`
	Message   string    `json:"message,omitempty"`
}

// LogoutResponse định nghĩa cấu trúc cho response đăng xuất
type LogoutResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}


