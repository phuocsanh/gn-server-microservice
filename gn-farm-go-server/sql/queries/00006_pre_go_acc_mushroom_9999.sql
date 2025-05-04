-- name: CreateMushroom :one
INSERT INTO mushrooms (
    name,
    created_at,
    updated_at
) VALUES (
    $1, NOW(), NOW()
) RETURNING *;

-- name: GetMushroom :one
SELECT * FROM mushrooms WHERE id = $1;

-- name: UpdateMushroom :one
UPDATE mushrooms
SET
    name = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteMushroom :exec
DELETE FROM mushrooms WHERE id = $1;