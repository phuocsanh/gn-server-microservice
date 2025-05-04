-- +goose Up
-- Xóa bỏ hoàn toàn thuộc tính product_shop khỏi các bảng
ALTER TABLE mushrooms DROP COLUMN product_shop;
ALTER TABLE vegetables DROP COLUMN product_shop;
ALTER TABLE bonsais DROP COLUMN product_shop;

-- +goose Down
-- Khôi phục thuộc tính product_shop
ALTER TABLE mushrooms ADD COLUMN product_shop INTEGER NOT NULL DEFAULT 1;
ALTER TABLE vegetables ADD COLUMN product_shop INTEGER NOT NULL DEFAULT 1;
ALTER TABLE bonsais ADD COLUMN product_shop INTEGER NOT NULL DEFAULT 1;
