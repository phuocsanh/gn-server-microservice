-- +goose Up
-- Thêm trường image_url vào bảng product_types
ALTER TABLE product_types ADD COLUMN image_url TEXT;

-- Cập nhật dữ liệu mẫu với ảnh cho các product types hiện có
UPDATE product_types SET image_url = 'https://example.com/images/mushroom-category.jpg' WHERE name = 'Mushroom';
UPDATE product_types SET image_url = 'https://example.com/images/vegetable-category.jpg' WHERE name = 'Vegetable';
UPDATE product_types SET image_url = 'https://example.com/images/bonsai-category.jpg' WHERE name LIKE '%Bonsai%';

-- +goose Down
-- Xóa trường image_url khỏi bảng product_types
ALTER TABLE product_types DROP COLUMN IF EXISTS image_url;
