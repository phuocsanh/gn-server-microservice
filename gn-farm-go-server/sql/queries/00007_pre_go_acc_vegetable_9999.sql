-- name: CreateVegetable :one
INSERT INTO vegetables (
    name,
    created_at,
    updated_at
) VALUES (
    $1, NOW(), NOW()
) RETURNING *;

-- name: GetVegetable :one
SELECT * FROM vegetables WHERE id = $1;

-- name: UpdateVegetable :one
UPDATE vegetables
SET
    name = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteVegetable :exec
DELETE FROM vegetables WHERE id = $1;