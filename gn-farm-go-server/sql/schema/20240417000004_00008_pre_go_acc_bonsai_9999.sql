-- +goose Up
CREATE TABLE IF NOT EXISTS bonsais (
    id SERIAL PRIMARY KEY,
    product_shop INTEGER NOT NULL,
    brand VARCHAR(150),
    size VARCHAR(50),
    material VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS bonsais; 