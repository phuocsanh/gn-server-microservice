-- +goose Up
CREATE TABLE IF NOT EXISTS vegetables (
    id SERIAL PRIMARY KEY,
    product_shop INTEGER NOT NULL,
    manufacturer VARCHAR(150),
    model VARCHAR(50),
    color VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS vegetables; 