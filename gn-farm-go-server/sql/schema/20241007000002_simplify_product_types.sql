-- +goose Up
-- Đơn giản hóa bảng mushrooms
ALTER TABLE mushrooms DROP COLUMN IF EXISTS size;
ALTER TABLE mushrooms DROP COLUMN IF EXISTS material;
ALTER TABLE mushrooms RENAME COLUMN brand TO name;

-- Đơn giản hóa bảng vegetables
ALTER TABLE vegetables DROP COLUMN IF EXISTS model;
ALTER TABLE vegetables DROP COLUMN IF EXISTS color;
ALTER TABLE vegetables RENAME COLUMN manufacturer TO name;

-- Đơn giản hóa bảng bonsais
ALTER TABLE bonsais DROP COLUMN IF EXISTS size;
ALTER TABLE bonsais DROP COLUMN IF EXISTS material;
ALTER TABLE bonsais RENAME COLUMN brand TO name;

-- +goose Down
-- Khôi phục bảng mushrooms
ALTER TABLE mushrooms ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE mushrooms ADD COLUMN IF NOT EXISTS material VARCHAR(50);
ALTER TABLE mushrooms RENAME COLUMN name TO brand;

-- Khôi phục bảng vegetables
ALTER TABLE vegetables ADD COLUMN IF NOT EXISTS model VARCHAR(50);
ALTER TABLE vegetables ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vegetables RENAME COLUMN name TO manufacturer;

-- Khôi phục bảng bonsais
ALTER TABLE bonsais ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE bonsais ADD COLUMN IF NOT EXISTS material VARCHAR(50);
ALTER TABLE bonsais RENAME COLUMN name TO brand;
