const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Monorepo-aware config so the app can import '@margwatch/shared-types'
 * from ../../packages/shared-types.
 *
 * @type {import('metro-config').MetroConfig}
 */
const monorepoConfig = {
  watchFolders: [
    path.resolve(__dirname, '../../packages/shared-types'),
  ],
  resolver: {
    extraNodeModules: {
      '@margwatch/shared-types': path.resolve(
        __dirname,
        '../../packages/shared-types',
      ),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), monorepoConfig);
