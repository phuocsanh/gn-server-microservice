-- name: CreateBonsai :one
INSERT INTO bonsais (
    product_shop,
    brand,
    size,
    material,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), NOW()
) RETURNING *;

-- name: GetBonsai :one
SELECT * FROM bonsais WHERE id = $1;

-- name: UpdateBonsai :one
UPDATE bonsais
SET 
    product_shop = $2,
    brand = $3,
    size = $4,
    material = $5,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteBonsai :exec
DELETE FROM bonsais WHERE id = $1; 