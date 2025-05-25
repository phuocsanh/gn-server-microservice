package user_test

import (
	"context"
	"testing"

	"gn-farm-go-server/internal/service/impl/user"
	"gn-farm-go-server/internal/testutil"
	uservo "gn-farm-go-server/internal/vo/user"
	"gn-farm-go-server/pkg/response"
)

// TestUserAuth_Register tests user registration functionality
func TestUserAuth_Register(t *testing.T) {
	// Setup test database
	queries := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t)

	// Create service instance
	service := user.NewUserAuthImpl(queries)

	tests := []struct {
		name     string
		input    *uservo.RegisterRequest
		wantCode int
		wantErr  bool
	}{
		{
			name: "Valid registration",
			input: &uservo.RegisterRequest{
				VerifyKey:     "newuser@example.com",
				VerifyType:    1,
				VerifyPurpose: "TEST_USER",
			},
			wantCode: response.ErrCodeSuccess,
			wantErr:  false,
		},
		{
			name: "Empty email",
			input: &uservo.RegisterRequest{
				VerifyKey:     "",
				VerifyType:    1,
				VerifyPurpose: "TEST_USER",
			},
			wantCode: response.ErrCodeParamInvalid,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			code, err := service.Register(context.Background(), tt.input)

			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if code != tt.wantCode {
					t.Errorf("Expected code %d, got %d", tt.wantCode, code)
				}
			}
		})
	}
}

// TestUserAuth_Login tests user login functionality
func TestUserAuth_Login(t *testing.T) {
	// Setup test database
	queries := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t)

	// Create service instance
	service := user.NewUserAuthImpl(queries)

	tests := []struct {
		name     string
		input    *uservo.LoginRequest
		wantCode int
		wantErr  bool
	}{
		{
			name: "Valid login credentials",
			input: &uservo.LoginRequest{
				UserAccount:  "test@example.com",
				UserPassword: "password123",
			},
			wantCode: response.ErrCodeSuccess,
			wantErr:  false,
		},
		{
			name: "Empty user account",
			input: &uservo.LoginRequest{
				UserAccount:  "",
				UserPassword: "password123",
			},
			wantCode: response.ErrCodeParamInvalid,
			wantErr:  true,
		},
		{
			name: "Empty password",
			input: &uservo.LoginRequest{
				UserAccount:  "test@example.com",
				UserPassword: "",
			},
			wantCode: response.ErrCodeParamInvalid,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			code, result, err := service.Login(context.Background(), tt.input)

			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if code != tt.wantCode {
					t.Errorf("Expected code %d, got %d", tt.wantCode, code)
				}
				// Check if result has expected structure
				if result.User.UserAccount == "" {
					t.Errorf("Expected user account in result")
				}
				if result.Tokens.AccessToken == "" {
					t.Errorf("Expected access token in result")
				}
			}
		})
	}
}
