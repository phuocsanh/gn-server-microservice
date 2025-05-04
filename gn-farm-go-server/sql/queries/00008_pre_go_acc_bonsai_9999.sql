-- name: CreateBonsai :one
INSERT INTO bonsais (
    name,
    created_at,
    updated_at
) VALUES (
    $1, NOW(), NOW()
) RETURNING *;

-- name: GetBonsai :one
SELECT * FROM bonsais WHERE id = $1;

-- name: UpdateBonsai :one
UPDATE bonsais
SET
    name = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteBonsai :exec
DELETE FROM bonsais WHERE id = $1;