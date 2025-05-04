-- name: GetOneUserInfo :one
SELECT user_id, user_account, user_password, user_salt
FROM pre_go_acc_user_base_9999
WHERE user_account = $1;

-- name: GetOneUserInfoAdmin :one
SELECT user_id, user_account, user_password, user_salt, user_login_time, user_logout_time, user_login_ip
        ,user_created_at, user_updated_at
FROM pre_go_acc_user_base_9999
WHERE user_account = $1;

-- name: CheckUserBaseExists :one
SELECT COUNT(*)
FROM pre_go_acc_user_base_9999
WHERE user_account = $1;

-- name: AddUserBase :one
INSERT INTO pre_go_acc_user_base_9999 (
    user_account, user_password, user_salt, user_created_at, user_updated_at
) VALUES (
    $1, $2, $3, NOW(), NOW()
)
RETURNING user_id;

-- name: LoginUserBase :exec
UPDATE pre_go_acc_user_base_9999
SET user_login_time = NOW(), user_login_ip = $1
WHERE user_account = $2 AND user_password = $3;

-- name: LogoutUserBase :exec
UPDATE pre_go_acc_user_base_9999
SET user_logout_time = NOW()
WHERE user_account = $1;

