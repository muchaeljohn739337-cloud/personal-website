module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2020",
          module: "commonjs",
          moduleResolution: "node",
          lib: ["ES2020"],
          allowJs: true,
          skipLibCheck: true,
          strict: false,
          noImplicitAny: false,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          isolatedModules: false,
        },
        isolatedModules: false,
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.{ts,js}", "!src/index.ts", "!src/**/*.d.ts", "!src/**/*.interface.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testTimeout: 30000,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 80,
    },
  },
};
