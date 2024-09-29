const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  testPathIgnorePatterns: ['__utils__'].concat(
    nxPreset.testPathIgnorePatterns ?? []
  ),
  coveragePathIgnorePatterns: ['__utils__'].concat(
    nxPreset.coveragePathIgnorePatterns ?? []
  ),
};
