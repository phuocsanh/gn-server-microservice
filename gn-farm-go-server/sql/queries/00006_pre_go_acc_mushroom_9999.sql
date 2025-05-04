-- name: CreateMushroom :one
INSERT INTO mushrooms (
    product_shop,
    brand,
    size,
    material,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), NOW()
) RETURNING *;

-- name: GetMushroom :one
SELECT * FROM mushrooms WHERE id = $1;

-- name: UpdateMushroom :one
UPDATE mushrooms
SET 
    product_shop = $2,
    brand = $3,
    size = $4,
    material = $5,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteMushroom :exec
DELETE FROM mushrooms WHERE id = $1; 