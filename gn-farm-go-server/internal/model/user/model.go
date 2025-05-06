package user

// UserInfo chứa thông tin người dùng
type UserInfo struct {
	ID    string `json:"_id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// TokenPair chứa cặp token
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}
