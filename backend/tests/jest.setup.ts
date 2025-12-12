// Jest setup file that runs before each test file

// Set longer timeout for database operations
jest.setTimeout(30000); // 30 seconds

// Suppress console logs during tests (optional - comment out to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
