// Cấu hình kết nối PostgreSQL cho việc quản lý thông tin người dùng
const { Pool } = require("pg") // Pool kết nối PostgreSQL để tối ưu hiệu suất

// Biến lưu trữ pool kết nối để tái sử dụng
let pool

/**
 * Hàm kết nối tới cơ sở dữ liệu PostgreSQL
 * Sử dụng cho việc quản lý:
 * - Thông tin người dùng (profiles, authentication)
 * - Dữ liệu quan hệ giữa các thực thể
 * - Metadata hệ thống
 * @returns {Promise<Pool>} Pool kết nối PostgreSQL
 */
const connectPostgres = async () => {
  try {
    // Tạo pool kết nối với các thông số từ biến môi trường
    pool = new Pool({
      host: process.env.POSTGRES_HOST || "postgres_gn_farm", // Địa chỉ server
      port: process.env.POSTGRES_PORT || 5432, // Port kết nối
      user: process.env.POSTGRES_USER || "postgres", // Tên người dùng
      password: process.env.POSTGRES_PASSWORD || "123456", // Mật khẩu
      database: process.env.POSTGRES_DB || "GO_GN_FARM", // Tên database
    })

    // Kiểm tra kết nối bằng cách lấy một client và giải phóng
    const client = await pool.connect()
    client.release() // Trả lại client vào pool

    console.log("PostgreSQL connected") // Thông báo kết nối thành công
    return pool
  } catch (error) {
    console.error("PostgreSQL connection error:", error) // Ghi lại lỗi
    process.exit(1) // Thoát ứng dụng nếu lỗi
  }
}

/**
 * Lấy pool kết nối đã được khởi tạo
 * @returns {Pool} Pool kết nối PostgreSQL
 * @throws {Error} Nếu chưa khởi tạo kết nối
 */
const getPool = () => {
  if (!pool) {
    throw new Error(
      "PostgreSQL has not been initialized. Call connectPostgres first."
    )
  }
  return pool
}

// Export các hàm để sử dụng ở các module khác
module.exports = { connectPostgres, getPool }
