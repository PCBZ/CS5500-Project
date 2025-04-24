export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setup.js'],
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
  moduleFileExtensions: ['js', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}; 