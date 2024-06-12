module.exports = {
  preset: 'detox',
  testTimeout: 120000,
  testRunner: 'jest-circus/runner',
  setupFilesAfterEnv: ['./init.js']
};