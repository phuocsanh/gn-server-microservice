package user

// Domain Models for Authentication Business Logic
// These represent core business entities and use cases

// AuthenticationUseCase định nghĩa các use case cho authentication domain
type AuthenticationUseCase struct {
	// Business logic methods sẽ được implement ở service layer
}

// UserDomain đại diện cho user entity trong domain layer
type UserDomain struct {
	ID       int64
	Account  string
	Email    string
	Password string // Hashed password
}

// TokenDomain đại diện cho token entity trong domain layer
type TokenDomain struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64
	UserID       int64
}

// AuthenticationResult đại diện cho kết quả authentication
type AuthenticationResult struct {
	User         UserDomain
	Token        TokenDomain
	IsSuccessful bool
	ErrorMessage string
}
