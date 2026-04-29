module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],

  // Separate unit and integration test projects
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/routes/**/*.test.ts',
        '<rootDir>/tests/middleware/**/*.test.ts',
        '<rootDir>/tests/utils/**/*.test.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.ts'],
      testTimeout: 5000,
      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>'],
      testMatch: ['<rootDir>/tests/integration/**/*.{integration.test.ts,test.ts}'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup/setupIntegrationTests.ts'],
      testTimeout: 30000,
      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,
      globals: {
        'ts-jest': {
          isolatedModules: true,
          tsconfig: {
            strict: false,
            noImplicitAny: false,
            strictNullChecks: false,
          }
        }
      }
    }
  ],

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/app.ts',
    '!src/config/**',
    '!src/**/*.d.ts'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
};
