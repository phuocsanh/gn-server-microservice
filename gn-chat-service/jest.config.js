/**
 * #####################################################################
 * CẤU HÌNH JEST TESTING FRAMEWORK - GN CHAT SERVICE
 * File này cấu hình Jest cho việc chạy unit tests và integration tests
 *
 * Chức năng chính:
 * - Thiết lập môi trường test Node.js
 * - Cấu hình thu thập coverage và báo cáo
 * - Định nghĩa pattern tìm kiếm test files
 * - Cấu hình timeout và setup files
 *
 * Tác giả: GN Farm Development Team
 * Phiên bản: 1.0
 * #####################################################################
 */

module.exports = {
  // ===== MÔI TRƯỜNG TEST =====
  // Sử dụng Node.js environment cho backend testing
  testEnvironment: "node",

  // ===== PATTERN TÌM KIẾM TEST FILES =====
  // Tự động tìm và chầy các file test theo pattern
  testMatch: [
    "**/tests/**/*.test.js", // Các file .test.js trong thư mục tests
    "**/tests/**/*.spec.js", // Các file .spec.js trong thư mục tests
  ],

  // ===== CẤU HÌNH CODE COVERAGE =====
  // Thu thập thông tin coverage để đo lường chất lượng test
  collectCoverage: true, // Kích hoạt thu thập coverage
  coverageDirectory: "coverage", // Thư mục lưu báo cáo coverage
  coverageReporters: ["text", "lcov", "html"], // Định dạng báo cáo: text + HTML + LCOV
  collectCoverageFrom: [
    "src/**/*.js", // Thu thập coverage từ tất cả file JS trong src
    "!src/index.js", // Loại trừ file entry point
    "!src/config/**", // Loại trừ các file config
    "!**/node_modules/**", // Loại trừ node_modules
  ],

  // ===== CẤU HÌNH SETUP =====
  // File setup chạy trước mỗi test suite để khởi tạo môi trường
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // ===== ĐƯỜNG DẪN MODULE =====
  // Thư mục tìm kiếm modules khi import trong tests
  moduleDirectories: ["node_modules", "src"],

  // ===== TIMEOUT CẤU HÌNH =====
  // Thời gian chờ tối đa cho mỗi test case (30 giây)
  testTimeout: 30000,

  // ===== XÓA MOCK GIỮA CÁC TEST =====
  // Tự động reset tất cả mocks sau mỗi test để tránh interference
  clearMocks: true,

  // ===== CHI TIẾT OUTPUT =====
  // Hiển thị thông tin chi tiết khi chạy tests
  verbose: true,

  // ===== NGƯỢNG COVERAGE TỐI THIỂU =====
  // Tạm thời tắt để dễ dàng setup ban đầu
  // Sẽ bật lại khi có đủ tests để đảm bảo chất lượng
  // coverageThreshold: {
  //   global: {
  //     branches: 10,      // 10% branches được test
  //     functions: 10,     // 10% functions được test
  //     lines: 10,         // 10% lines được test
  //     statements: 10,    // 10% statements được test
  //   },
  // },
}
