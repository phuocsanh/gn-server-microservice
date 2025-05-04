-- name: GetValidOTP :one
SELECT verify_otp, verify_key_hash, verify_key, verify_id
FROM pre_go_acc_user_verify_9999
WHERE verify_key_hash = $1 AND is_verified = 0;

-- update lai
-- name: UpdateUserVerificationStatus :exec
UPDATE pre_go_acc_user_verify_9999
SET is_verified = 1,
    verify_updated_at = now()
WHERE verify_key_hash = $1;

-- name: InsertOTPVerify :execresult
INSERT INTO pre_go_acc_user_verify_9999 (
    verify_otp,
    verify_key,
    verify_key_hash,
    verify_type,
    is_verified,
    is_deleted,
    verify_created_at,
    verify_updated_at
)
VALUES ($1, $2, $3, $4, 0, 0, NOW(), NOW());

-- name: GetInfoOTP :one
SELECT verify_id, verify_otp, verify_key, verify_key_hash, verify_type, is_verified, is_deleted, verify_created_at, verify_updated_at
FROM pre_go_acc_user_verify_9999
WHERE verify_key_hash = $1;

-- name: GetOTPByVerifyKey :one
SELECT COUNT(*)
FROM pre_go_acc_user_verify_9999
WHERE verify_key = $1;

-- name: UpdateOTPByVerifyKey :exec
UPDATE pre_go_acc_user_verify_9999
SET verify_otp = $1,
    verify_key_hash = $2,
    verify_type = $3,
    is_verified = 0,
    is_deleted = 0,
    verify_updated_at = NOW()
WHERE verify_key = $4;
