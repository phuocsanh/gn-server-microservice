-- name: GetProductType :one
SELECT * FROM product_types WHERE id = $1;

-- name: ListProductTypes :many
SELECT * FROM product_types ORDER BY id;

-- name: CreateProductType :one
INSERT INTO product_types (
    name,
    description
) VALUES (
    $1, $2
) RETURNING *;

-- name: UpdateProductType :one
UPDATE product_types
SET 
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteProductType :exec
DELETE FROM product_types WHERE id = $1;
