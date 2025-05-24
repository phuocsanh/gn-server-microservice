package model

import "gn-farm-go-server/internal/database"

type RegisterInput struct {
	VerifyKey     string `json:"verifyKey"`
	VerifyType    int    `json:"verifyType"`
	VerifyPurpose string `json:"verifyPurpose"`
}

type VerifyInput struct {
	VerifyKey  string `json:"verifyKey"`
	VerifyCode string `json:"verifyCode"`
}

type VerifyOTPOutput struct {
	Token       string `json:"token,omitempty"`       // Giữ lại để tương thích ngược
	VerifyToken string `json:"verifyToken,omitempty"` // Giữ lại để tương thích ngược
	User        UserInfo  `json:"user,omitempty"`     // Thông tin người dùng
	Tokens      TokenPair `json:"tokens,omitempty"`   // Cặp token
	ExpiresIn   int       `json:"expiresIn,omitempty"`// Thời gian hết hạn của access token (giây)
	Message     string    `json:"message,omitempty"`
}

type UpdatePasswordRegisterInput struct {
	UserToken    string `json:"userToken"`
	UserPassword string `json:"userPassword"`
}

type LoginInput struct {
	UserAccount  string `json:"userAccount"`
	UserPassword string `json:"userPassword"`
}

// UserInfo chứa thông tin người dùng
type UserInfo struct {
	ID    string `json:"_id"`    // ID người dùng
	Email string `json:"email"`  // Email người dùng
	Name  string `json:"name"`   // Tên người dùng
}

// TokenPair chứa cặp token
type TokenPair struct {
	AccessToken  string `json:"accessToken"`  // Access token
	RefreshToken string `json:"refreshToken"` // Refresh token
}

// LoginOutput định dạng dữ liệu trả về khi đăng nhập
type LoginOutput struct {
	User      UserInfo  `json:"user"`       // Thông tin người dùng
	Tokens    TokenPair `json:"tokens"`     // Cặp token
	ExpiresIn int       `json:"expiresIn"`  // Thời gian hết hạn của access token (giây)
	Message   string    `json:"message,omitempty"`
}

// Refresh token request
type RefreshTokenInput struct {
	RefreshToken string `json:"refreshToken"`
}

// Refresh token response (same structure as LoginOutput)
type RefreshTokenOutput struct {
	User      UserInfo  `json:"user"`       // Thông tin người dùng
	Tokens    TokenPair `json:"tokens"`     // Cặp token
	ExpiresIn int       `json:"expiresIn"`  // Thời gian hết hạn của access token (giây)
	Message   string    `json:"message,omitempty"`
}

// two factor authentication
type SetupTwoFactorAuthInput struct {
	UserId            uint32 `json:"userId"`
	TwoFactorAuthType string `json:"twoFactorAuthType"`
	TwoFactorEmail    string `json:"twoFactorEmail"`
}

type TwoFactorVerificationInput struct {
	UserId        uint32 `json:"userId"`
	TwoFactorCode string `json:"twoFactorCode"`
}

// LogoutInput định dạng dữ liệu đầu vào cho logout
type LogoutInput struct {
	AccessToken string `json:"accessToken,omitempty"` // Token hiện tại (có thể lấy từ header)
}

// LogoutOutput định dạng dữ liệu trả về khi logout
type LogoutOutput struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

// ListUsersInput định dạng dữ liệu đầu vào cho lấy danh sách user
type ListUsersInput struct {
	Page     int    `json:"page" form:"page"`         // Trang hiện tại (bắt đầu từ 1)
	PageSize int    `json:"pageSize" form:"pageSize"` // Số lượng user trên mỗi trang
	Search   string `json:"search" form:"search"`     // Từ khóa tìm kiếm theo tên/email
}

// UserListItem định dạng thông tin user trong danh sách
// Bây giờ sử dụng trực tiếp database.UserProfile với JSON tags
type UserListItem = database.UserProfile



// ListUsersOutput định dạng dữ liệu trả về cho danh sách user
type ListUsersOutput struct {
	Users      []UserListItem `json:"users"`      // Danh sách user
	Total      int64          `json:"total"`      // Tổng số user
	Page       int            `json:"page"`       // Trang hiện tại
	PageSize   int            `json:"pageSize"`   // Số lượng user trên mỗi trang
	TotalPages int            `json:"totalPages"` // Tổng số trang
	HasNext    bool           `json:"hasNext"`    // Có trang tiếp theo không
	HasPrev    bool           `json:"hasPrev"`    // Có trang trước không
	Message    string         `json:"message,omitempty"`
}
