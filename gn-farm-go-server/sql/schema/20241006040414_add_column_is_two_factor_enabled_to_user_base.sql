-- +goose Up
-- +goose StatementBegin
ALTER TABLE pre_go_acc_user_base_9999
-- Use BOOLEAN type for PostgreSQL
ADD COLUMN is_two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Add comment separately
COMMENT ON COLUMN pre_go_acc_user_base_9999.is_two_factor_enabled IS 'authentication is enabled for the user';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE pre_go_acc_user_base_9999
DROP COLUMN IF EXISTS is_two_factor_enabled; -- Added IF EXISTS for robustness
-- +goose StatementEnd
