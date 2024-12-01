/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  // ignore files from test/helpers and dist
  testPathIgnorePatterns: ['<rootDir>/test/helpers/', '<rootDir>/dist/'],
  coveragePathIgnorePatterns: ['<rootDir>/test/helpers/', '<rootDir>/dist/'],
};
