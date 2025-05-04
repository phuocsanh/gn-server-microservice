-- name: CreateVegetable :one
INSERT INTO vegetables (
    product_shop,
    manufacturer,
    model,
    color,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), NOW()
) RETURNING *;

-- name: GetVegetable :one
SELECT * FROM vegetables WHERE id = $1;

-- name: UpdateVegetable :one
UPDATE vegetables
SET 
    product_shop = $2,
    manufacturer = $3,
    model = $4,
    color = $5,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteVegetable :exec
DELETE FROM vegetables WHERE id = $1; 