-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,                         -- User ID (PostgreSQL: SERIAL)
    user_account VARCHAR(255) NOT NULL,                 -- User account (used to verify identity)
    user_password VARCHAR(255) NOT NULL,                -- User password
    user_salt VARCHAR(255) NOT NULL,                    -- Salt used for password encryption
    -- isTwoFactorEnabled
    user_login_time TIMESTAMPTZ NULL,                   -- Last login time (PostgreSQL: TIMESTAMPTZ)
    user_logout_time TIMESTAMPTZ NULL,                  -- Last logout time (PostgreSQL: TIMESTAMPTZ)
    user_login_ip VARCHAR(45) NULL,                     -- Login IP address (45 characters to support IPv6)

    user_created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Record creation time (PostgreSQL: TIMESTAMPTZ)
    user_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Record update time (PostgreSQL: TIMESTAMPTZ, ON UPDATE handled by app/trigger)

    -- Ensure user_account is unique (PostgreSQL: CONSTRAINT UNIQUE)
    CONSTRAINT unique_user_account UNIQUE (user_account)
);

-- Add table comment (PostgreSQL: Separate statement)
COMMENT ON TABLE users IS 'users';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Remove backticks for PostgreSQL compatibility
DROP TABLE IF EXISTS users;
-- +goose StatementEnd
